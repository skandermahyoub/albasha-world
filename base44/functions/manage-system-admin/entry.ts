import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Manage SystemAdmin records — only super admins (users without a SystemAdmin record)
 * can create, update, or delete SystemAdmin accounts.
 *
 * This prevents any role=admin user from:
 * - Creating SystemAdmin records
 * - Editing their own permissions
 * - Raising their own permissions
 * - Editing or deleting other SystemAdmin records
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, admin_id, data } = body;

    // Must be authenticated
    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) {
      return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    // Check if caller is a super admin (no SystemAdmin record for their email)
    const callerAdmins = await base44.asServiceRole.entities.SystemAdmin.filter({
      email: user.email
    });
    if (callerAdmins.length > 0) {
      return Response.json({ error: 'هذه العملية متاحة فقط لمدير النظام الرئيسي (Super Admin)' }, { status: 403 });
    }

    // ── CREATE ──
    if (action === 'create') {
      const { name, email, employee_number, password_hash, permissions, is_active } = data || {};
      if (!name || !email) {
        return Response.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
      }
      // Prevent duplicate email
      const existing = await base44.asServiceRole.entities.SystemAdmin.filter({ email });
      if (existing.length > 0) {
        return Response.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
      }
      const created = await base44.asServiceRole.entities.SystemAdmin.create({
        name,
        email,
        employee_number: employee_number || '',
        password_hash: password_hash || '',
        is_active: is_active !== false,
        permissions: permissions || {},
      });
      return Response.json({ success: true, admin: { id: created.id, name, email } });
    }

    // ── UPDATE ──
    if (action === 'update') {
      if (!admin_id) {
        return Response.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });
      }
      const target = await base44.asServiceRole.entities.SystemAdmin.get(admin_id);
      if (!target) {
        return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
      }
      // Prevent editing own record (super admin has no record, so this is for safety)
      if (target.email === user.email) {
        return Response.json({ error: 'لا يمكنك تعديل صلاحيات حسابك الخاص' }, { status: 403 });
      }
      const updateData = {};
      const allowedFields = ['name', 'employee_number', 'password_hash', 'is_active', 'permissions'];
      for (const f of allowedFields) {
        if (data[f] !== undefined) updateData[f] = data[f];
      }
      await base44.asServiceRole.entities.SystemAdmin.update(admin_id, updateData);
      return Response.json({ success: true });
    }

    // ── DELETE ──
    if (action === 'delete') {
      if (!admin_id) {
        return Response.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });
      }
      const target = await base44.asServiceRole.entities.SystemAdmin.get(admin_id);
      if (!target) {
        return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
      }
      if (target.email === user.email) {
        return Response.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 403 });
      }
      await base44.asServiceRole.entities.SystemAdmin.delete(admin_id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}