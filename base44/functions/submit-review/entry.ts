import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MAX_NAME = 80;
const MAX_COMMENT = 1200;
const ALLOWED_CONTEXTS = ['store', 'blog'];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const name = String(body?.name || '').trim().slice(0, MAX_NAME);
    const comment = String(body?.comment || '').trim().slice(0, MAX_COMMENT);
    const rating = Number(body?.rating);
    const context = ALLOWED_CONTEXTS.includes(body?.context) ? body.context : 'store';
    const contentId = String(body?.content_id || '').trim().slice(0, 120);
    if (context === 'blog' && !contentId) return Response.json({ error: 'معرف المقال مطلوب' }, { status: 400 });
    if (!name || !comment) return Response.json({ error: 'الاسم والتعليق مطلوبان' }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: 'التقييم يجب أن يكون بين 1 و5' }, { status: 400 });

    let user: any = null;
    try { user = await base44.auth.me(); } catch {}
    const userKey = user?.email || `${req.headers.get('x-forwarded-for') || 'unknown'}|${req.headers.get('user-agent') || ''}`;
    const recent = await base44.asServiceRole.entities.Review.list('-created_date', 200).catch(() => []);
    const hourAgo = Date.now() - 3600_000;
    const count = recent.filter((r: any) => {
      const same = user?.email ? r.user_email === user.email : r.visitor_key === userKey;
      return same && new Date(r.created_date || 0).getTime() >= hourAgo;
    }).length;
    if (count >= 3) return Response.json({ error: 'تم بلوغ الحد المؤقت لإرسال الآراء' }, { status: 429 });

    const created = await base44.asServiceRole.entities.Review.create({
      name,
      phone: '',
      rating,
      comment,
      context,
      content_id: contentId,
      user_email: user?.email || '',
      visitor_key: user?.email ? '' : userKey,
      status: 'pending',
    });
    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر إرسال الرأي' }, { status: 500 });
  }
}
