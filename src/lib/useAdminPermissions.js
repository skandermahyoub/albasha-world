import useStaffAccess from '@/lib/useStaffAccess';

const levels = ['none', 'view', 'add', 'edit', 'delete', 'full'];
export function useAdminPermissions() {
  const { permissions = {}, superAdmin, isStaff, loading } = useStaffAccess();
  const can = (section, level = 'view') => {
    if (superAdmin) return true;
    if (!isStaff || !section) return false;
    const permission = permissions[section];
    if (section === 'notifications') {
      if (level === 'view') return ['view', 'send', 'full'].includes(permission);
      if (level === 'send') return ['send', 'full'].includes(permission);
      if (['add', 'edit', 'delete', 'full'].includes(level)) return permission === 'full';
      return false;
    }
    return levels.indexOf(permission) >= levels.indexOf(level);
  };
  return { permissions: superAdmin ? { _super: true } : permissions, loading, isStaff, can, canView: section => can(section, 'view'), canEdit: section => can(section, 'edit'), canDelete: section => can(section, 'delete'), canFull: section => can(section, 'full') };
}
export function pathToPermissionKey(pathname) {
  if (pathname === '/admin' || pathname === '/admin/') return null;
  const route = pathname.replace('/admin/', '');
  const map = { settings: 'settings', 'store-configs': 'stores', 'store-identity': 'stores', products: 'products', categories: 'products', offers: 'products', bundles: 'products', brands: 'products', 'ai-tools': 'settings', 'image-gallery': 'settings', slides: 'settings', banners: 'settings', 'home-highlights': 'settings', marquee: 'settings', gallery: 'settings', videos: 'settings', 'dev-roadmap': 'settings', 'audit-log': 'settings', 'system-admins': 'settings', 'system-accounts': 'accounting', payments: 'settings', orders: 'orders', cashier: 'orders', 'abandoned-carts': 'orders', returns: 'orders', accounting: 'accounting', 'smart-manager': 'accounting', wallets: 'accounting', erp: 'reports', affiliates: 'reports', crm: 'crm', messages: 'customers', reviews: 'customers', subscribers: 'customers', tickets: 'customers', employees: 'employees', blog: 'blog', contests: 'blog', surveys: 'blog', 'social-posts': 'blog', delivery: 'delivery', shipping: 'delivery', suppliers: 'stores', 'purchase-orders': 'stores', coupons: 'coupons', 'gift-cards': 'coupons', notifications: 'notifications' };
  return map[route] || null;
}