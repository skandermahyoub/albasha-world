const VIEW_LEVELS = ['view', 'add', 'edit', 'delete', 'full'];
const ADD_LEVELS = ['add', 'edit', 'delete', 'full'];
const EDIT_LEVELS = ['edit', 'delete', 'full'];
const DELETE_LEVELS = ['delete', 'full'];

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
  if (section === 'notifications') {
    if (operation === 'view') return ['view', 'send', 'full'].includes(permission);
    if (operation === 'send' || operation === 'add' || operation === 'edit') return ['send', 'full'].includes(permission);
    if (operation === 'delete') return permission === 'full';
    return false;
  }
  if (operation === 'view') return VIEW_LEVELS.includes(permission);
  if (operation === 'add') return ADD_LEVELS.includes(permission);
  if (operation === 'edit') return EDIT_LEVELS.includes(permission);
  if (operation === 'delete') return DELETE_LEVELS.includes(permission);
  if (operation === 'full') return permission === 'full';
  return false;
}

export async function requireStaffPermission(base44, user, section, operation = 'view') {
  const access = await getStaffAccess(base44, user);
  if (!access.isStaff || !canStaff(access, section, operation)) return null;
  return access;
}