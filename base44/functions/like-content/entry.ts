import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const TYPES = ['app', 'product', 'blog', 'video'];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const contentType = String(body?.content_type || '');
    const contentId = String(body?.content_id || '').slice(0, 120);
    const visitorKey = String(body?.visitor_key || '').slice(0, 200);
    if (!TYPES.includes(contentType) || !contentId || visitorKey.length < 8) return Response.json({ error: 'بيانات التفاعل غير صالحة' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.ContentReaction.filter({ content_type: contentType, content_id: contentId, visitor_key: visitorKey }, '-created_date', 1).catch(() => []);
    if (existing.length) {
      const all = await base44.asServiceRole.entities.ContentReaction.filter({ content_type: contentType, content_id: contentId }, '-created_date', 1000).catch(() => []);
      return Response.json({ success: true, already_liked: true, likes: all.length });
    }
    await base44.asServiceRole.entities.ContentReaction.create({ content_type: contentType, content_id: contentId, visitor_key: visitorKey, reaction: 'like' });
    const all = await base44.asServiceRole.entities.ContentReaction.filter({ content_type: contentType, content_id: contentId }, '-created_date', 1000).catch(() => []);
    return Response.json({ success: true, already_liked: false, likes: all.length });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تسجيل الإعجاب' }, { status: 500 });
  }
}
