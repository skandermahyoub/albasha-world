import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });
    const { review_id } = await req.json();
    if (!review_id) return Response.json({ error: 'معرف التقييم مطلوب' }, { status: 400 });

    const reviews = await base44.asServiceRole.entities.ProductReview.filter({ id: review_id, status: 'approved' });
    const review = reviews[0];
    if (!review) return Response.json({ error: 'التقييم غير موجود' }, { status: 404 });

    const existing = await base44.asServiceRole.entities.ProductReviewHelpfulVote.filter({ review_id, user_email: user.email });
    if (existing.length) return Response.json({ success: true, already_voted: true, helpful_count: review.helpful_count || 0 });

    await base44.asServiceRole.entities.ProductReviewHelpfulVote.create({ review_id, user_email: user.email });
    const helpfulCount = (review.helpful_count || 0) + 1;
    await base44.asServiceRole.entities.ProductReview.update(review.id, { helpful_count: helpfulCount });
    return Response.json({ success: true, already_voted: false, helpful_count: helpfulCount });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تسجيل التصويت' }, { status: 500 });
  }
}
