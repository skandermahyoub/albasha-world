import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) {
      return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    // Check if already registered
    const existing = await base44.asServiceRole.entities.Affiliate.filter({
      customer_email: user.email
    });
    if (existing.length > 0) {
      return Response.json({
        success: false,
        error: 'أنت مسجل بالفعل كمسوّق',
        affiliate: {
          status: existing[0].status,
          affiliate_code: existing[0].affiliate_code,
          referral_link: existing[0].referral_link,
        }
      });
    }

    // Generate unique code
    const code = `${user.full_name?.[0] || 'A'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const origin = new URL(req.url).origin;
    const referralLink = `${origin}?ref=${code}`;

    const aff = await base44.asServiceRole.entities.Affiliate.create({
      affiliate_code: code,
      customer_email: user.email,
      customer_name: user.full_name || user.email,
      phone: '',
      status: 'pending',
      commission_rate: 5,
      total_clicks: 0,
      total_sales: 0,
      total_commission: 0,
      paid_commission: 0,
      referral_link: referralLink,
    });

    return Response.json({ success: true, affiliate: aff });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}