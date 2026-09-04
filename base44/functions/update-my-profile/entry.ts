import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_FIELDS = ['full_name', 'name', 'id_number', 'address', 'profile_photo', 'phone'];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (body?.[field] !== undefined) data[field] = body[field];
    }
    if (!Object.keys(data).length) return Response.json({ error: 'لا توجد بيانات قابلة للتحديث' }, { status: 400 });

    const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email }, '-created_date', 1);
    let profile;
    if (profiles.length) {
      profile = await base44.asServiceRole.entities.CustomerProfile.update(profiles[0].id, data);
    } else {
      profile = await base44.asServiceRole.entities.CustomerProfile.create({
        user_email: user.email,
        name: user.full_name || String(data.full_name || ''),
        ...data,
      });
    }
    return Response.json({ success: true, profile });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر حفظ الملف الشخصي' }, { status: 500 });
  }
}
