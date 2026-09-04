import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { product_id } = await req.json();
    if (!product_id) return Response.json({ error: 'معرف المنتج مطلوب' }, { status: 400 });
    const rows = await base44.asServiceRole.entities.ProductReview.filter({ product_id, status: 'approved' }, '-created_date', 100);
    const reviews = rows.map(r => ({
      id: r.id,
      user_name: r.user_name || 'عميل',
      rating: r.rating,
      title: r.title || '',
      comment: r.comment || '',
      image_url: r.image_url || '',
      verified_purchase: r.verified_purchase === true,
      helpful_count: r.helpful_count || 0,
      created_date: r.created_date,
    }));
    return Response.json({ success: true, reviews });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل التقييمات' }, { status: 500 });
  }
}
