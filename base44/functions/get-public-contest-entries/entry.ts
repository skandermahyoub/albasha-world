import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const entries = await base44.asServiceRole.entities.ContestEntry.filter({ status: 'approved' }, '-votes', 100);
    return Response.json({
      success: true,
      entries: entries.map((entry: any) => ({
        id: entry.id,
        contest_id: entry.contest_id,
        user_name: entry.user_name || 'مشارك',
        image: entry.image,
        caption: entry.caption || '',
        votes: Number(entry.votes) || 0,
        rank: entry.rank || null,
        status: 'approved',
      })),
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل المشاركات', entries: [] }, { status: 500 });
  }
}
