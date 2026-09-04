import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const body = await req.json();
    if (!body?.contest_id || !body?.image) return Response.json({ error: 'بيانات المشاركة غير مكتملة' }, { status: 400 });
    const entry = await base44.asServiceRole.entities.ContestEntry.create({
      contest_id: body.contest_id,
      user_email: user?.email || '',
      user_name: user?.full_name || 'مشارك',
      image: body.image,
      caption: String(body.caption || '').slice(0, 500),
      votes: 0,
      status: 'pending'
    });
    return Response.json({ success: true, entry_id: entry.id });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر إرسال المشاركة' }, { status: 500 });
  }
}
