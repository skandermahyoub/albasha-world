import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const { notification_id } = await req.json();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const notifications = await base44.asServiceRole.entities.Notification.filter({ id: notification_id, customer_email: user.email }).catch(() => []);
    const notification = notifications[0];
    if (!notification) return Response.json({ error: 'الإشعار غير متاح' }, { status: 404 });
    if (notification.target_type !== 'order') return Response.json({ success: true, route: notification.target_route || '/my-account' });
    const order = await base44.asServiceRole.entities.Order.get(notification.target_id).catch(() => null);
    if (!order) return Response.json({ error: 'العنصر المرتبط لم يعد متاحاً' }, { status: 404 });
    const isStaffRoute = notification.target_route?.startsWith('/admin/');
    if (isStaffRoute) {
      const access = await requireStaffPermission(base44, user, 'orders', 'view');
      if (!access) return Response.json({ error: 'لا تملك صلاحية مشاهدة هذا الطلب' }, { status: 403 });
    } else if (order.customer_email?.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ error: 'لا تملك صلاحية الوصول إلى هذا الطلب' }, { status: 403 });
    }
    return Response.json({ success: true, route: notification.target_route });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر فتح الإشعار' }, { status: 500 });
  }
}