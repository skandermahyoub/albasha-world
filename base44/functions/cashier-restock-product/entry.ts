import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'edit');
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const productId = String(body?.product_id || '');
    const qty = Math.floor(Number(body?.quantity) || 0);
    const shiftId = String(body?.shift_id || '');
    if (!productId || qty <= 0 || qty > 100000) return Response.json({ error: 'بيانات المخزون غير صحيحة' }, { status: 400 });

    const product = await base44.asServiceRole.entities.Product.get(productId).catch(() => null);
    if (!product || product.is_seed === true || product.status === 'archived') return Response.json({ error: 'المنتج غير متاح' }, { status: 404 });
    const before = Math.max(0, Number(product.stock) || 0);
    const after = before + qty;
    await base44.asServiceRole.entities.Product.update(product.id, { stock: after });
    await base44.asServiceRole.entities.InventoryMovement.create({
      product_id: product.id,
      product_title: product.title,
      sku: product.sku || '',
      type: 'restock',
      quantity: qty,
      stock_before: before,
      stock_after: after,
      unit_price: Number(product.price) || 0,
      total: (Number(product.price) || 0) * qty,
      order_id: '',
      order_number: '',
      shift_id: shiftId,
      is_test: false,
      note: 'إضافة مخزون من الكاشير',
    });
    return Response.json({ success: true, product: { id: product.id, stock: after }, before, after });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحديث المخزون' }, { status: 500 });
  }
}
