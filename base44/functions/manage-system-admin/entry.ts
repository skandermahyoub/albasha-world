import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'هذه العملية متاحة لمدير النظام الرئيسي فقط' }, { status: 403 });
    const { action, admin_id, data = {} } = await req.json();
    if (action === 'create') {
      if (!data.name || !data.email) return Response.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.SystemAdmin.filter({ email: data.email });
      if (existing.length) return Response.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
      const admin = await base44.asServiceRole.entities.SystemAdmin.create({ name: data.name, email: data.email, employee_number: data.employee_number || '', is_active: data.is_active !== false, permissions: data.permissions || {} });
      return Response.json({ success: true, admin });
    }
    const target = await base44.asServiceRole.entities.SystemAdmin.get(admin_id).catch(() => null);
    if (!target) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
    if (action === 'update') {
      const update = {};
      ['name', 'employee_number', 'is_active', 'permissions', 'notes'].forEach(field => { if (data[field] !== undefined) update[field] = data[field]; });
      await base44.asServiceRole.entities.SystemAdmin.update(target.id, update);
      return Response.json({ success: true });
    }
    if (action === 'delete') { await base44.asServiceRole.entities.SystemAdmin.delete(target.id); return Response.json({ success: true }); }
    return Response.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}