import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const context = String(body?.context || 'store').slice(0, 30);
    const contentId = String(body?.content_id || '').slice(0, 120);
    const query: any = { status: 'approved', context };
    if (contentId) query.content_id = contentId;
    const rows = await base44.asServiceRole.entities.Review.filter(query, '-created_date', 100).catch(() => []);
    const reviews = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      context: r.context || 'store',
      content_id: r.content_id || '',
      created_date: r.created_date,
    }));
    return Response.json({ success: true, reviews });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل الآراء' }, { status: 500 });
  }
}
