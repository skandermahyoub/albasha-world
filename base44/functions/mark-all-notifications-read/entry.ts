import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    await base44.asServiceRole.entities.Notification.updateMany(
      { customer_email: user.email, is_read: false },
      { $set: { is_read: true, read_at: new Date().toISOString() } }
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحديث الإشعارات' }, { status: 500 });
  }
}