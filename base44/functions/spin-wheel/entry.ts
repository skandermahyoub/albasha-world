import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PRIZES = [5, 10, 15, 20, 7, 12, 25, 3];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BASHA-SPIN-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getVisitorKey(req) {
  // Build a lightweight fingerprint: IP + user-agent hash
  const ip = req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  return `${ip}::${ua.slice(0, 50)}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { store_key } = body;

    // Determine identity
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    const visitorKey = getVisitorKey(req);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Check if already played today
    // For logged-in users: by user_id; for guests: by visitor_key
    let existingAttempt = null;
    if (user) {
      const attempts = await base44.asServiceRole.entities.SpinWheelAttempt.filter({
        user_id: user.id
      }, '-created_date', 50);
      existingAttempt = attempts.find(a => (a.created_date || '').slice(0, 10) === todayStr);
    } else {
      const attempts = await base44.asServiceRole.entities.SpinWheelAttempt.filter({
        visitor_key: visitorKey
      }, '-created_date', 50);
      existingAttempt = attempts.find(a => (a.created_date || '').slice(0, 10) === todayStr);
    }

    if (existingAttempt) {
      return Response.json({
        success: false,
        already_played: true,
        code: existingAttempt.coupon_code,
        discount: existingAttempt.discount_percent,
        message: 'لقد لعبت اليوم! عد غداً.'
      });
    }

    // Determine prize on SERVER, not client
    const winnerIndex = Math.floor(Math.random() * PRIZES.length);
    const discountPercent = PRIZES[winnerIndex];
    const couponCode = generateCode();

    // Determine store_key for the coupon
    const targetStore = store_key || 'pets';

    // Create a real Coupon record
    const coupon = await base44.asServiceRole.entities.Coupon.create({
      code: couponCode,
      store_key: targetStore,
      discount_type: 'percentage',
      discount_value: discountPercent,
      min_order_value: 0,
      max_uses: 1,
      used_count: 0,
      is_active: true,
      valid_until: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      description: `عجلة الحظ — خصم ${discountPercent}%`,
      source: 'spin_wheel',
    });

    // Record the attempt
    await base44.asServiceRole.entities.SpinWheelAttempt.create({
      user_id: user?.id || '',
      user_email: user?.email || '',
      visitor_key: visitorKey,
      coupon_id: coupon.id,
      coupon_code: couponCode,
      discount_percent: discountPercent,
      status: 'active',
    });

    return Response.json({
      success: true,
      code: couponCode,
      discount: discountPercent,
      winner_index: winnerIndex,
      message: `مبروك! ربحت خصم ${discountPercent}%`
    });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}