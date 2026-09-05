import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'view');
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    const orders = await base44.asServiceRole.entities.Order.filter({ source: { $ne: 'test' } }, '-created_date', 500);
    return Response.json({ success: true, orders });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل الطلبات' }, { status: 500 });
  }
}