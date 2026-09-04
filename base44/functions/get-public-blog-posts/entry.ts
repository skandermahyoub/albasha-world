import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '').slice(0, 120);
    const category = String(body?.category || '').slice(0, 80);
    const limit = Math.max(1, Math.min(Number(body?.limit) || 50, 100));
    const query: any = { status: 'published' };
    if (id) query.id = id;
    if (category) query.category = category;
    const rows = await base44.asServiceRole.entities.BlogPost.filter(query, '-created_date', limit).catch(() => []);
    const posts = rows.map((p: any) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      content: p.content,
      image: p.image,
      category: p.category,
      tags: p.tags || [],
      status: 'published',
      views: Number(p.views) || 0,
      created_date: p.created_date,
      updated_date: p.updated_date,
    }));
    return Response.json({ success: true, posts });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل المقالات' }, { status: 500 });
  }
}
