import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const LEVELS = ['none', 'view', 'add', 'edit', 'delete', 'full'];

/**
 * Hook that loads the current admin's SystemAdmin.permissions.
 *
 * - If no SystemAdmin record exists for the user's email → they are a
 *   super admin (platform-level admin) and have full access to everything.
 * - Otherwise, the permissions object from their SystemAdmin record is used.
 */
export function useAdminPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const admins = await base44.entities.SystemAdmin.filter({ email: user.email }).catch(() => []);
        if (admins.length === 0) {
          // No SystemAdmin record → platform super admin
          setPermissions({ _super: true });
        } else {
          setPermissions(admins[0].permissions || {});
        }
      } catch {
        // On error, assume super admin to avoid locking out
        setPermissions({ _super: true });
      }
      setLoading(false);
    };
    load();
  }, [user?.email]);

  const can = (section, level = 'view') => {
    if (!permissions) return false;
    if (permissions._super) return true;
    if (!section) return true; // sections without a permission key are always visible
    const perm = permissions[section];
    if (!perm || perm === 'none') return false;
    return LEVELS.indexOf(perm) >= LEVELS.indexOf(level);
  };

  const canView = (section) => can(section, 'view');
  const canEdit = (section) => can(section, 'edit');
  const canDelete = (section) => can(section, 'delete');
  const canFull = (section) => can(section, 'full');

  return { permissions, loading, can, canView, canEdit, canDelete, canFull };
}

/**
 * Maps an admin route path to a SystemAdmin permission key.
 * Returns null for routes that are always visible (dashboard).
 */
export function pathToPermissionKey(pathname) {
  if (pathname === '/admin' || pathname === '/admin/') return null;
  const route = pathname.replace('/admin/', '');

  const map = {
    settings: 'settings', 'store-configs': 'stores', 'store-identity': 'stores',
    products: 'products', categories: 'products', offers: 'products', bundles: 'products',
    brands: 'products', 'ai-tools': 'settings', 'image-gallery': 'settings',
    slides: 'settings', banners: 'settings', 'home-highlights': 'settings', marquee: 'settings', gallery: 'settings',
    videos: 'settings', 'dev-roadmap': 'settings', 'audit-log': 'settings',
    'system-admins': 'settings', 'system-accounts': 'settings', payments: 'settings',
    orders: 'orders', cashier: 'orders', 'abandoned-carts': 'orders', returns: 'orders',
    accounting: 'accounting', 'smart-manager': 'accounting', wallets: 'accounting',
    erp: 'reports', affiliates: 'reports',
    crm: 'crm', messages: 'customers', reviews: 'customers', subscribers: 'customers',
    tickets: 'customers',
    employees: 'employees',
    blog: 'blog', contests: 'blog', surveys: 'blog', 'social-posts': 'blog',
    delivery: 'delivery', shipping: 'delivery', suppliers: 'stores', 'purchase-orders': 'stores',
    coupons: 'coupons', 'gift-cards': 'coupons',
  };

  return map[route] || null;
}