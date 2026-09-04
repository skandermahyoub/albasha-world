import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'edit');
    if (!access) return Response.json({ error: 'صلاحية غير كافية لتسجيل المرتجع' }, { status: 403 });
    const { order_number, note } = await req.json();
    if (!order_number) return Response.json({ error: 'رقم الفاتورة مطلوب' }, { status: 400 });

    const orders = await base44.asServiceRole.entities.Order.filter({ order_number }, '-created_date', 1);
    const order = orders[0];
    if (!order) return Response.json({ error: 'لم يتم العثور على الفاتورة' }, { status: 404 });
    if (order.source !== 'cashier') return Response.json({ error: 'هذه الفاتورة ليست من نقطة البيع' }, { status: 400 });
    if (order.status === 'returned') return Response.json({ error: 'هذه الفاتورة مرتجعة مسبقاً' }, { status: 409 });
    if (order.status !== 'delivered') return Response.json({ error: 'لا يمكن إرجاع فاتورة غير مكتملة' }, { status: 400 });

    for (const item of order.items || []) {
      const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
      if (!product) continue;
      const qty = Number(item.quantity) || 0;
      const before = Number(product.stock) || 0;
      const after = before + qty;
      await base44.asServiceRole.entities.Product.update(product.id, { stock: after, sales_count: Math.max(0, (Number(product.sales_count) || 0) - qty) });
      await base44.asServiceRole.entities.InventoryMovement.create({ product_id: product.id, product_title: item.title || product.title, sku: product.sku || '', type: 'return', quantity: qty, stock_before: before, stock_after: after, unit_price: Number(item.price) || 0, total: (Number(item.price) || 0) * qty, order_id: order.id, order_number: order.order_number, shift_id: order.shift_id || '', note: note || 'مرتجع نقطة البيع' });
    }

    const original = await base44.asServiceRole.entities.SystemTransaction.filter({ type: 'order_profit', order_number: order.order_number }, '-created_date', 1).catch(() => []);
    const existingReturn = await base44.asServiceRole.entities.SystemTransaction.filter({ type: 'order_return', order_number: order.order_number }, '-created_date', 1).catch(() => []);
    if (!existingReturn.length) {
      await base44.asServiceRole.entities.SystemTransaction.create({ type: 'order_return', amount: -(Number(order.total) || 0), order_number: order.order_number, order_subtotal: Number(order.subtotal) || 0, order_discount: Number(order.discount) || 0, performed_by: user.full_name || user.email, reason: note || `مرتجع نقطة البيع ${order.order_number}`, date: new Date().toISOString(), reference_transaction_id: original[0]?.id || '' });
    }

    const history = [...(order.status_history || []), { status: 'returned', date: new Date().toISOString() }];
    await base44.asServiceRole.entities.Order.update(order.id, { status: 'returned', status_history: history, notes: note || order.notes || 'مرتجع من الكاشير', stock_deducted: false, sales_updated: false, return_processed: true, financial_reversed: true });
    return Response.json({ success: true, order_number: order.order_number });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تسجيل المرتجع' }, { status: 500 });
  }
}
