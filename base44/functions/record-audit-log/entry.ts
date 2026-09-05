import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getStaffAccess } from '../../shared/staffAuthorization.ts';

const ACTIONS = new Set(['create','update','delete','login','logout','export','import','settings_change','price_change','other']);

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await getStaffAccess(base44, user);
    if (!access?.isStaff) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const action = ACTIONS.has(String(body?.action)) ? String(body.action) : 'other';
    const record = await base44.asServiceRole.entities.AuditLog.create({
      action,
      entity_type: String(body?.entity_type || '').slice(0, 100),
      entity_id: String(body?.entity_id || '').slice(0, 160),
      entity_name: String(body?.entity_name || '').slice(0, 250),
      performed_by: String(user.full_name || user.email || 'النظام').slice(0, 250),
      performed_by_email: String(user.email || '').slice(0, 320),
      description: String(body?.description || '').slice(0, 1000),
      old_value: String(body?.old_value || '').slice(0, 12000),
      new_value: String(body?.new_value || '').slice(0, 12000),
    });
    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تسجيل الإجراء' }, { status: 500 });
  }
}
