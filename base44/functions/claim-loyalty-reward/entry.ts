import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const REWARDS: Record<string, number> = {
  contest_upload: 50,
  contest_share: 25,
};

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const { action, reference_id } = await req.json();
    const points = REWARDS[action];
    if (!points || !reference_id) return Response.json({ error: 'مكافأة غير صالحة' }, { status: 400 });

    // Upload reward is limited to one claim per contest; share reward to one per entry.
    const eventKey = `${action}:${reference_id}`;
    const existing = await base44.asServiceRole.entities.LoyaltyRewardClaim.filter({ user_email: user.email, event_key: eventKey }, '-created_date', 1);
    if (existing.length) return Response.json({ success: true, awarded: 0, already_claimed: true });

    if (action === 'contest_share') {
      const entry = await base44.asServiceRole.entities.ContestEntry.get(reference_id).catch(() => null);
      if (!entry || entry.user_email?.toLowerCase() !== user.email.toLowerCase()) {
        return Response.json({ error: 'هذه المشاركة لا تخص حسابك' }, { status: 403 });
      }
    }
    if (action === 'contest_upload') {
      const entries = await base44.asServiceRole.entities.ContestEntry.filter({ contest_id: reference_id, user_email: user.email }, '-created_date', 1);
      if (!entries.length) return Response.json({ error: 'لم يتم العثور على مشاركتك' }, { status: 404 });
    }

    const records = await base44.asServiceRole.entities.LoyaltyPoints.filter({ user_email: user.email }, '-created_date', 1);
    const record = records[0];
    const description = action === 'contest_upload' ? 'مكافأة المشاركة في مسابقة' : 'مكافأة مشاركة المسابقة';
    const historyEntry = { action: 'earn', points, date: new Date().toISOString(), description };

    if (record) {
      await base44.asServiceRole.entities.LoyaltyPoints.update(record.id, {
        points: (record.points || 0) + points,
        total_earned: (record.total_earned || 0) + points,
        history: [...(record.history || []), historyEntry],
      });
    } else {
      await base44.asServiceRole.entities.LoyaltyPoints.create({
        user_email: user.email,
        points,
        total_earned: points,
        total_spent: 0,
        history: [historyEntry],
      });
    }

    await base44.asServiceRole.entities.LoyaltyRewardClaim.create({
      user_email: user.email,
      event_key: eventKey,
      action,
      points,
      description,
    });

    return Response.json({ success: true, awarded: points });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر إضافة نقاط الولاء' }, { status: 500 });
  }
}
