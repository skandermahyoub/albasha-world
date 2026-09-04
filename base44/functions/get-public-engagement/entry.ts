import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const TYPES = ['app', 'product', 'blog', 'video'];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const contentType = String(body?.content_type || '');
    const contentId = String(body?.content_id || '').slice(0, 120);
    const visitorKey = String(body?.visitor_key || '').slice(0, 200);
    if (!TYPES.includes(contentType) || !contentId) return Response.json({ error: 'محتوى غير صالح' }, { status: 400 });

    const reactions = await base44.asServiceRole.entities.ContentReaction.filter({ content_type: contentType, content_id: contentId }, '-created_date', 1000).catch(() => []);
    const comments = await base44.asServiceRole.entities.ContentComment.filter({ content_type: contentType, content_id: contentId, status: 'approved' }, '-created_date', 50).catch(() => []);
    return Response.json({
      success: true,
      likes: reactions.length,
      liked: !!visitorKey && reactions.some((r: any) => r.visitor_key === visitorKey),
      comments: comments.map((c: any) => ({ id: c.id, name: c.name, comment: c.comment, created_date: c.created_date })),
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل التفاعلات' }, { status: 500 });
  }
}
