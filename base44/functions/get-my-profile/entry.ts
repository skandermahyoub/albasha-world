import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const rows = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email, is_archived: false }, '-created_date', 1).catch(() => []);
    const p = rows[0];
    if (!p) return Response.json({ success: true, profile: null });
    return Response.json({ success: true, profile: {
      id: p.id,
      user_email: p.user_email,
      name: p.name || '',
      full_name: p.full_name || '',
      id_number: p.id_number || '',
      profile_photo: p.profile_photo || '',
      address: p.address || '',
      phone: p.phone || '',
      tier: p.tier || 'bronze',
      total_spent: Number(p.total_spent) || 0,
      orders_count: Number(p.orders_count) || 0,
      wallet_balance: Number(p.wallet_balance) || 0,
      affiliate_code: p.affiliate_code || '',
      is_affiliate: p.is_affiliate === true,
      preferred_store: p.preferred_store || '',
    }});
  } catch (error: any) {
    return Response.json({ error: error?.message || 'تعذر تحميل الملف الشخصي' }, { status: 500 });
  }
}
