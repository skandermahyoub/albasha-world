import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const cards = await base44.asServiceRole.entities.GiftCard.filter({ issued_by_email: user.email }, '-created_date', 100).catch(() => []);
    return Response.json({
      success: true,
      cards: cards.map((card: any) => ({
        id: card.id,
        code: card.code,
        amount: Number(card.amount) || 0,
        used_amount: Number(card.used_amount) || 0,
        currency: card.currency || 'USD',
        issued_to_email: card.issued_to_email || '',
        status: card.status,
        expires_at: card.expires_at || null,
      })),
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل بطاقات الهدايا' }, { status: 500 });
  }
}
