import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

const STORE_KEYS = ['shisha', 'vape', 'boutique', 'perfume', 'pets'];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'add');
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || '').trim().slice(0, 200);
    const sku = String(body?.sku || '').trim().slice(0, 100);
    const price = Number(body?.price) || 0;
    const stock = Math.floor(Number(body?.stock) || 0);
    const storeKey = String(body?.store_key || '');
    const categoryId = String(body?.category_id || '');
    const shiftId = String(body?.shift_id || '');
    if (!title || price <= 0 || stock <= 0 || !STORE_KEYS.includes(storeKey) || !categoryId) {
      return Response.json({ error: 'بيانات المنتج غير مكتملة أو غير صحيحة' }, { status: 400 });
    }
    const categories = await base44.asServiceRole.entities.Category.filter({ id: categoryId, store_key: storeKey, is_active: true }, 'sort_order', 1).catch(() => []);
    if (!categories.length || categories[0].is_seed === true) return Response.json({ error: 'التصنيف غير صالح' }, { status: 400 });
    if (sku) {
      const duplicate = await base44.asServiceRole.entities.Product.filter({ sku }, '-created_date', 1).catch(() => []);
      if (duplicate.length && duplicate[0].is_seed !== true) return Response.json({ error: 'الباركود / SKU مستخدم بالفعل' }, { status: 409 });
    }
    const slugBase = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').slice(0, 160) || `product-${Date.now()}`;
    const product = await base44.asServiceRole.entities.Product.create({
      title,
      sku,
      price,
      cost_price: 0,
      stock,
      store_key: storeKey,
      category_id: categoryId,
      status: 'active',
      slug: `${slugBase}-${Date.now().toString(36)}`,
      show_price: true,
      show_cart_btn: true,
      show_fav_btn: true,
      show_compare_btn: true,
      sales_count: 0,
      is_seed: false,
    });
    await base44.asServiceRole.entities.InventoryMovement.create({
      product_id: product.id,
      product_title: product.title,
      sku: product.sku || '',
      type: 'restock',
      quantity: stock,
      stock_before: 0,
      stock_after: stock,
      unit_price: price,
      total: price * stock,
      order_id: '',
      order_number: '',
      shift_id: shiftId,
      is_test: false,
      note: 'إنشاء منتج سريع من الكاشير',
    });
    return Response.json({ success: true, product });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر إنشاء المنتج' }, { status: 500 });
  }
}
