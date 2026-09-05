import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SORTS = new Set(['-created_date', 'created_date', '-sales_count', 'sales_count', 'price', '-price', 'title']);

function publicProduct(p: any) {
  return {
    id: p.id,
    title: p.title,
    subtitle: p.subtitle || '',
    description: p.description || '',
    image: p.image || '',
    images: Array.isArray(p.images) ? p.images : [],
    price: Number(p.price) || 0,
    old_price: p.old_price == null ? null : Number(p.old_price),
    discount_end_date: p.discount_end_date || null,
    category_id: p.category_id || '',
    store_key: p.store_key || '',
    brand: p.brand || '',
    brand_id: p.brand_id || '',
    slug: p.slug || '',
    unit: p.unit || '',
    attributes: p.attributes && typeof p.attributes === 'object' ? p.attributes : {},
    variants: Array.isArray(p.variants) ? p.variants.map((v: any) => ({
      name: v.name || '', sku: v.sku || '', price: Number(v.price) || 0,
      stock: Number(v.stock) || 0, image: v.image || '', attributes: v.attributes || {},
    })) : [],
    flavor: p.flavor || '',
    nicotine_level: p.nicotine_level || '',
    warranty: p.warranty || '',
    color_name: p.color_name || '',
    accessory_type: p.accessory_type || '',
    compatibility: p.compatibility || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    is_featured: p.is_featured === true,
    is_bestseller: p.is_bestseller === true,
    is_new: p.is_new === true,
    is_coming_soon: p.is_coming_soon === true,
    is_subscribable: p.is_subscribable === true,
    subscription_discount: Number(p.subscription_discount) || 0,
    stock: p.stock == null ? null : Number(p.stock),
    sku: p.sku || '',
    power_wattage: p.power_wattage || '',
    volume: p.volume || '',
    status: 'active',
    show_price: p.show_price !== false,
    show_cart_btn: p.show_cart_btn !== false,
    show_fav_btn: p.show_fav_btn !== false,
    show_compare_btn: p.show_compare_btn !== false,
    sales_count: Number(p.sales_count) || 0,
    created_date: p.created_date,
  };
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const query: any = { status: 'active', is_seed: { $ne: true } };
    if (body?.id) query.id = String(body.id).slice(0, 120);
    if (body?.store_key) query.store_key = String(body.store_key).slice(0, 60);
    if (body?.category_id) query.category_id = String(body.category_id).slice(0, 120);
    if (Array.isArray(body?.ids) && body.ids.length) query.id = { $in: body.ids.map(String).slice(0, 200) };
    const limit = Math.max(1, Math.min(Number(body?.limit) || 100, 1000));
    const sort = SORTS.has(body?.sort) ? body.sort : '-created_date';
    const rows = await base44.asServiceRole.entities.Product.filter(query, sort, limit).catch(() => []);
    return Response.json({ success: true, products: rows.map(publicProduct) });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'تعذر تحميل المنتجات' }, { status: 500 });
  }
}
