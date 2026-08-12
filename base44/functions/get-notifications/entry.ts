import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const notifications = await base44.asServiceRole.entities.Notification.filter({ customer_email: user.email }, '-created_date', 50);
    return Response.json({ success: true, notifications: notifications.filter(item => item.is_active !== false) });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل الإشعارات' }, { status: 500 });
  }
}