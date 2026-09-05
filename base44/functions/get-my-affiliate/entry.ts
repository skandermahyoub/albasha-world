import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const records = await base44.asServiceRole.entities.Affiliate.filter({ customer_email: user.email }, '-created_date', 1).catch(() => []);
    const affiliate = records[0];
    if (!affiliate) return Response.json({ success: true, affiliate: null });
    return Response.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        affiliate_code: affiliate.affiliate_code,
        status: affiliate.status,
        commission_rate: Number(affiliate.commission_rate) || 0,
        total_clicks: Number(affiliate.total_clicks) || 0,
        total_sales: Number(affiliate.total_sales) || 0,
        total_commission: Number(affiliate.total_commission) || 0,
        paid_commission: Number(affiliate.paid_commission) || 0,
        referral_link: affiliate.referral_link || '',
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل بيانات المسوق' }, { status: 500 });
  }
}
