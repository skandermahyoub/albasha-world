import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const TYPES = ['app', 'product', 'blog', 'video'];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const contentType = String(body?.content_type || '');
    const contentId = String(body?.content_id || '').slice(0, 120);
    const name = String(body?.name || '').trim().slice(0, 80);
    const comment = String(body?.comment || '').trim().slice(0, 1500);
    const visitorKey = String(body?.visitor_key || '').slice(0, 200);
    if (!TYPES.includes(contentType) || !contentId || !name || !comment) return Response.json({ error: 'الاسم والتعليق والمحتوى مطلوبة' }, { status: 400 });

    const recent = await base44.asServiceRole.entities.ContentComment.filter({ content_type: contentType, content_id: contentId }, '-created_date', 100).catch(() => []);
    const hourAgo = Date.now() - 3600_000;
    const sameVisitorRecent = recent.filter((c: any) => c.visitor_key === visitorKey && new Date(c.created_date || 0).getTime() >= hourAgo).length;
    if (visitorKey && sameVisitorRecent >= 5) return Response.json({ error: 'تم بلوغ الحد المؤقت للتعليقات' }, { status: 429 });

    const created = await base44.asServiceRole.entities.ContentComment.create({
      content_type: contentType,
      content_id: contentId,
      name,
      comment,
      visitor_key: visitorKey,
      status: 'pending',
    });
    return Response.json({ success: true, id: created.id, status: 'pending' });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر إرسال التعليق' }, { status: 500 });
  }
}
