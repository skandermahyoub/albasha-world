import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'add');
    if (!access) return Response.json({ error: 'صلاحية غير كافية لإتمام البيع' }, { status: 403 });

    const body = await req.json();
    const { items, customer_name, customer_phone, payment_method, discount, shift_id, idempotency_key } = body || {};
    if (!Array.isArray(items) || !items.length) return Response.json({ error: 'سلة البيع فارغة' }, { status: 400 });
    if (!shift_id) return Response.json({ error: 'يجب فتح وردية قبل البيع' }, { status: 400 });

    const shifts = await base44.asServiceRole.entities.CashierShift.filter({ id: shift_id, status: 'open' }, '-created_date', 1);
    if (!shifts.length) return Response.json({ error: 'الوردية غير متاحة أو مغلقة' }, { status: 409 });

    if (idempotency_key) {
      const existing = await base44.asServiceRole.entities.Order.filter({ idempotency_key }, '-created_date', 1).catch(() => []);
      if (existing.length) return Response.json({ success: true, order: existing[0], idempotent: true });
    }

    const rows: any[] = [];
    for (const item of items) {
      const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
      if (!product || product.status !== 'active') return Response.json({ error: 'أحد المنتجات غير متاح' }, { status: 400 });
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 0));
      const available = Number(product.stock);
      if (Number.isFinite(available) && available < qty) return Response.json({ error: `المخزون غير كافٍ للمنتج ${product.title} — المتاح ${available}` }, { status: 409 });
      rows.push({ product, qty });
    }

    const subtotal = rows.reduce((sum, row) => sum + (Number(row.product.price) || 0) * row.qty, 0);
    const discountAmount = Math.min(Math.max(0, Number(discount) || 0), subtotal);
    const total = Math.max(0, subtotal - discountAmount);
    const orderNumber = `POS-${Date.now().toString().slice(-8)}`;
    const orderItems = rows.map(({ product, qty }) => ({ product_id: product.id, title: product.title, price: Number(product.price) || 0, quantity: qty, image: product.image || '' }));

    const order = await base44.asServiceRole.entities.Order.create({
      order_number: orderNumber,
      customer_name: String(customer_name || '').trim() || 'عميل نقدي',
      customer_phone: String(customer_phone || '').trim() || '-',
      items: orderItems,
      subtotal,
      discount: discountAmount,
      total,
      amount_due: total,
      currency: 'USD',
      status: 'delivered',
      status_history: [{ status: 'delivered', date: new Date().toISOString() }],
      payment_method: payment_method || 'cash',
      shift_id,
      source: 'cashier',
      idempotency_key: idempotency_key || `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      stock_deducted: true,
      sales_updated: true,
      commission_calculated: true,
      customer_metrics_updated: false,
      financial_reversed: false,
    });

    for (const { product, qty } of rows) {
      const before = Number(product.stock) || 0;
      const after = before - qty;
      await base44.asServiceRole.entities.Product.update(product.id, { stock: after, sales_count: (Number(product.sales_count) || 0) + qty });
      await base44.asServiceRole.entities.InventoryMovement.create({ product_id: product.id, product_title: product.title, sku: product.sku || '', type: 'sale', quantity: qty, stock_before: before, stock_after: after, unit_price: Number(product.price) || 0, total: (Number(product.price) || 0) * qty, order_id: order.id, order_number: orderNumber, shift_id, note: 'بيع نقطة البيع' });
    }

    await base44.asServiceRole.entities.SystemTransaction.create({ type: 'order_profit', amount: total, order_number: orderNumber, order_subtotal: subtotal, order_discount: discountAmount, performed_by: user.full_name || user.email, reason: `إيراد بيع نقطة البيع ${orderNumber}`, date: new Date().toISOString() });

    return Response.json({ success: true, order });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر إتمام البيع' }, { status: 500 });
  }
}
