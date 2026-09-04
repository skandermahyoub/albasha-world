import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const postId = String(body?.post_id || '').slice(0, 120);
    const visitorKey = String(body?.visitor_key || '').slice(0, 200);
    if (!postId || visitorKey.length < 8) return Response.json({ error: 'بيانات المشاهدة غير صالحة' }, { status: 400 });

    const posts = await base44.asServiceRole.entities.BlogPost.filter({ id: postId, status: 'published' }, '-created_date', 1).catch(() => []);
    const post = posts[0];
    if (!post) return Response.json({ error: 'المقال غير موجود' }, { status: 404 });

    const existing = await base44.asServiceRole.entities.BlogView.filter({ post_id: postId, visitor_key: visitorKey }, '-created_date', 1).catch(() => []);
    if (existing.length) return Response.json({ success: true, counted: false, views: Number(post.views) || 0 });

    await base44.asServiceRole.entities.BlogView.create({ post_id: postId, visitor_key: visitorKey });
    const views = (Number(post.views) || 0) + 1;
    await base44.asServiceRole.entities.BlogPost.update(post.id, { views });
    return Response.json({ success: true, counted: true, views });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تسجيل المشاهدة' }, { status: 500 });
  }
}
