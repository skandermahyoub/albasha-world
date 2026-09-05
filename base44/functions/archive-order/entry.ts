import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'delete');
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.order_id || '');
    if (!orderId) return Response.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });
    const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!order || order.source === 'test') return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
    if (order.admin_archived === true) return Response.json({ success: true, already_archived: true });
    if (order.status !== 'cancelled') {
      return Response.json({ error: 'لا يمكن أرشفة الطلب إلا بعد إلغائه بصورة صحيحة' }, { status: 409 });
    }
    if (order.financial_reversed !== true) {
      return Response.json({ error: 'يجب إكمال العكس المالي للطلب قبل أرشفته' }, { status: 409 });
    }
    await base44.asServiceRole.entities.Order.update(order.id, { admin_archived: true });
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'delete',
      entity_type: 'Order',
      entity_id: order.id,
      entity_name: order.order_number || order.id,
      performed_by: user.full_name || user.email || 'الإدارة',
      performed_by_email: user.email || '',
      description: `أرشفة الطلب الملغي ${order.order_number || order.id}`,
    }).catch(() => {});
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر أرشفة الطلب' }, { status: 500 });
  }
}
