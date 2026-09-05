import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const { title, message, customer_email, broadcast, target_type, target_id, target_route } = await req.json();
    if (!title?.trim() || !message?.trim()) return Response.json({ error: 'العنوان والرسالة مطلوبان' }, { status: 400 });
    const access = await requireStaffPermission(base44, user, 'notifications', broadcast ? 'edit' : 'send');
    if (!access || (broadcast && !access.superAdmin && access.permissions?.notifications !== 'full')) return Response.json({ error: 'لا تملك صلاحية إرسال هذا الإشعار' }, { status: 403 });
    const recipients = broadcast ? [...new Set((await base44.asServiceRole.entities.CustomerProfile.filter({ is_archived: false }, '-created_date', 500)).map(profile => profile.user_email).filter(Boolean))] : [customer_email].filter(Boolean);
    if (!recipients.length) return Response.json({ error: 'اختر عميلاً أو تأكد من وجود عملاء مسجلين' }, { status: 400 });
    await base44.asServiceRole.entities.Notification.bulkCreate(recipients.map(email => ({ title: title.trim(), message: message.trim(), icon: '🔔', type: 'info', customer_email: email, target_type: target_type || '', target_id: target_id || '', target_route: target_route || '', is_read: false, is_active: true, interval_minutes: 5, sort_order: 0 })));
    return Response.json({ success: true, recipients: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر إرسال الإشعار' }, { status: 500 });
  }
}