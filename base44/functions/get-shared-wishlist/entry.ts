import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { token } = body;
    if (!token || typeof token !== 'string' || token.length < 10) {
      return Response.json({ success: false, error: 'الرابط غير صالح' }, { status: 404 });
    }

    // Find the wishlist by share_token — use service role since this is a public endpoint
    const lists = await base44.asServiceRole.entities.WishList.filter({
      share_token: token
    });

    if (lists.length === 0) {
      return Response.json({ success: false, error: 'القائمة غير موجودة أو انتهت صلاحيتها' }, { status: 404 });
    }

    const list = lists[0];

    // Must be public to be viewable
    if (!list.is_public) {
      return Response.json({ success: false, error: 'هذه القائمة خاصة ولا يمكن مشاركتها' }, { status: 403 });
    }

    // Fetch product details — only active products, current prices and images
    const productIds = list.product_ids || [];
    const items = [];

    for (const pid of productIds) {
      try {
        const product = await base44.asServiceRole.entities.Product.get(pid);
        if (!product) {
          items.push({ id: pid, available: false, unavailable_reason: 'المنتج لم يعد متاحاً' });
          continue;
        }

        const isAvailable = product.status !== 'archived' && product.status !== 'draft';
        items.push({
          id: product.id,
          title: product.title || 'منتج',
          price: product.price || 0,
          image: product.image || '',
          available: isAvailable,
          unavailable_reason: isAvailable ? null : 'المنتج لم يعد متاحاً',
        });
      } catch {
        // Product deleted or inaccessible
        items.push({ id: pid, available: false, unavailable_reason: 'المنتج لم يعد متاحاً' });
      }
    }

    return Response.json({
      success: true,
      list_name: list.name || 'قائمة أمنيات',
      items,
    });
  } catch (error) {
    return Response.json({ success: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}