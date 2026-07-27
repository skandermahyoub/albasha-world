import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_AMOUNTS = [50, 100, 200, 500, 1000];
const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MS = 3600 * 1000;

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BASHA-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { amount, to_email, message } = body;

    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) {
      return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    const amt = Number(amount);
    if (!ALLOWED_AMOUNTS.includes(amt)) {
      return Response.json({ error: 'القيمة غير مسموحة. القيم المسموحة: ' + ALLOWED_AMOUNTS.join(', ') }, { status: 400 });
    }

    if (!to_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to_email)) {
      return Response.json({ error: 'بريد المستلم غير صحيح' }, { status: 400 });
    }

    const msg = (message || '').slice(0, MAX_MESSAGE_LENGTH);

    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const recentCards = await base44.asServiceRole.entities.GiftCard.filter({
      issued_by_email: user.email,
    }, '-created_date', 100);
    const recentCount = recentCards.filter(c => (c.created_date || '') >= oneHourAgo).length;
    if (recentCount >= RATE_LIMIT_COUNT) {
      return Response.json({ error: 'لقد بلغت الحد المسموح من بطاقات الهدايا في هذه الساعة' }, { status: 429 });
    }

    const settingsList = await base44.asServiceRole.entities.StoreSettings.list();
    const settings = settingsList[0] || {};
    const currency = settings?.currency || 'USD';

    const code = generateCode();

    const card = await base44.asServiceRole.entities.GiftCard.create({
      code,
      amount: amt,
      currency,
      used_amount: 0,
      issued_to_email: to_email,
      issued_by_email: user.email,
      message: msg,
      status: 'pending',
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
    });

    return Response.json({
      success: true,
      card: {
        id: card.id,
        code,
        amount: amt,
        currency,
        status: 'pending',
        issued_to_email: to_email,
      },
      message: 'تم استلام طلب بطاقة الهداية. سيتم تفعيلها بعد معالجة الدفع.',
    });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}