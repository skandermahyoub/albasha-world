import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { notification_id } = await req.json();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const records = await base44.asServiceRole.entities.Notification.filter({ id: notification_id, customer_email: user.email });
    if (!records[0]) return Response.json({ error: 'الإشعار غير متاح' }, { status: 404 });
    await base44.asServiceRole.entities.Notification.update(notification_id, { is_read: true, read_at: new Date().toISOString() });
    return Response.json({ success: true, notification: records[0] });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحديث الإشعار' }, { status: 500 });
  }
}