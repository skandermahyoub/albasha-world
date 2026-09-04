import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function cleanText(value, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const body = await req.json();
    const productId = cleanText(body.product_id, 120);
    const userName = cleanText(body.user_name, 100);
    const title = cleanText(body.title, 160);
    const comment = cleanText(body.comment, 1500);
    const imageUrl = cleanText(body.image_url, 1200);
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 0));
    if (!productId || !userName || !comment || !rating) return Response.json({ error: 'بيانات التقييم غير مكتملة' }, { status: 400 });

    const products = await base44.asServiceRole.entities.Product.filter({ id: productId, status: 'active' });
    if (!products.length) return Response.json({ error: 'المنتج غير متاح' }, { status: 404 });

    let verifiedPurchase = false;
    if (user?.email) {
      const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: user.email, status: 'delivered' }, '-created_date', 200);
      verifiedPurchase = orders.some(o => (o.items || []).some(i => i.product_id === productId));
    }

    const review = await base44.asServiceRole.entities.ProductReview.create({
      product_id: productId,
      user_email: user?.email || '',
      user_name: userName,
      rating,
      title,
      comment,
      image_url: imageUrl,
      verified_purchase: verifiedPurchase,
      helpful_count: 0,
      status: 'pending',
    });
    return Response.json({ success: true, review_id: review.id, verified_purchase: verifiedPurchase });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر إرسال التقييم' }, { status: 500 });
  }
}
