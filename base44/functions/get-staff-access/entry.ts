import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getStaffAccess } from '../../shared/staffAuthorization.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await getStaffAccess(base44, user);
    return Response.json({ success: true, ...access });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر التحقق من صلاحيات الموظف' }, { status: 500 });
  }
}