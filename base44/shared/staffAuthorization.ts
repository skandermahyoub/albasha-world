const viewLevels = ['view', 'edit', 'delete', 'full'];
const editLevels = ['edit', 'delete', 'full'];

export async function getStaffAccess(base44, user) {
  if (user.role === 'admin') return { superAdmin: true, isStaff: true, permissions: {} };
  const records = await base44.asServiceRole.entities.SystemAdmin.filter({ email: user.email });
  const staff = records[0];
  if (!staff || staff.is_active === false) return { superAdmin: false, isStaff: false, permissions: {} };
  if (staff.user_id && staff.user_id !== user.id) return { superAdmin: false, isStaff: false, permissions: {} };
  if (!staff.user_id) await base44.asServiceRole.entities.SystemAdmin.update(staff.id, { user_id: user.id });
  return { superAdmin: false, isStaff: true, permissions: staff.permissions || {}, staffId: staff.id };
}

export function canStaff(access, section, operation = 'view') {
  if (access.superAdmin) return true;
  const permission = access.permissions?.[section];
  if (operation === 'view') return viewLevels.includes(permission);
  if (operation === 'send') return ['send', 'full'].includes(permission);
  return editLevels.includes(permission);
}

export async function requireStaffPermission(base44, user, section, operation = 'view') {
  const access = await getStaffAccess(base44, user);
  if (!access.isStaff || !canStaff(access, section, operation)) return null;
  return access;
}