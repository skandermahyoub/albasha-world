import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || '').trim().toUpperCase();
    if (!/^BASHA-[A-Z0-9]{6,16}$/.test(code)) return Response.json({ success: false, error: 'كود غير صحيح' }, { status: 400 });
    const cards = await base44.asServiceRole.entities.GiftCard.filter({ code }, '-created_date', 1).catch(() => []);
    const card = cards[0];
    if (!card) return Response.json({ success: false, error: 'كود غير صحيح' }, { status: 404 });
    const expired = card.expires_at && new Date(card.expires_at) < new Date();
    const effectiveStatus = expired ? 'expired' : card.status;
    return Response.json({
      success: true,
      card: {
        status: effectiveStatus,
        amount: Number(card.amount) || 0,
        used_amount: Number(card.used_amount) || 0,
        balance: Math.max(0, (Number(card.amount) || 0) - (Number(card.used_amount) || 0)),
        currency: card.currency || 'USD',
        expires_at: card.expires_at || null,
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: 'تعذر التحقق من البطاقة' }, { status: 500 });
  }
}
