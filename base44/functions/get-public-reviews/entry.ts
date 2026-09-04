import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const context = String(body?.context || 'store').slice(0, 30);
    const rows = await base44.asServiceRole.entities.Review.filter({ status: 'approved', context }, '-created_date', 100).catch(() => []);
    const reviews = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      context: r.context || 'store',
      created_date: r.created_date,
    }));
    return Response.json({ success: true, reviews });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل الآراء' }, { status: 500 });
  }
}
