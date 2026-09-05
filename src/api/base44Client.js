import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Base SDK client. Public storefront traffic uses entity RLS directly.
// Inside /admin, entity access is transparently routed through the secured
// staff-entity backend so SystemAdmin permissions and database access cannot diverge.
const sdkClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

const staffEntityCache = new Map();
const inAdminArea = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
const currentAdminContext = () => {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path === '/admin' || path === '/admin/') return null;
  const route = path.replace(/^\/admin\//, '').split('/')[0];
  const map = {
    settings: 'settings', 'store-configs': 'stores', 'store-identity': 'stores', products: 'products', categories: 'products', offers: 'products', bundles: 'products', brands: 'products',
    slides: 'settings', banners: 'settings', 'home-highlights': 'settings', marquee: 'settings', gallery: 'settings', videos: 'settings', 'dev-roadmap': 'settings', 'audit-log': 'settings', 'system-admins': 'settings', 'system-accounts': 'accounting', payments: 'settings',
    orders: 'orders', cashier: 'orders', 'abandoned-carts': 'orders', returns: 'orders', subscriptions: 'orders', accounting: 'accounting', 'smart-manager': 'accounting', wallets: 'accounting', erp: 'reports', affiliates: 'reports',
    crm: 'crm', messages: 'customers', reviews: 'customers', subscribers: 'customers', tickets: 'customers', employees: 'employees', blog: 'blog', contests: 'blog', surveys: 'blog', 'social-posts': 'blog',
    delivery: 'delivery', shipping: 'delivery', suppliers: 'stores', 'purchase-orders': 'stores', coupons: 'coupons', 'gift-cards': 'coupons', notifications: 'notifications'
  };
  return map[route] || null;
};

async function staffInvoke(entity, action, payload = {}) {
  const res = await sdkClient.functions.invoke('staff-entity', { entity, action, context_section: currentAdminContext(), ...payload });
  if (!res?.data?.success) {
    const err = new Error(res?.data?.error || 'تعذر تنفيذ العملية');
    err.status = res?.status;
    throw err;
  }
  return res.data.result;
}

function getStaffEntity(entity) {
  if (staffEntityCache.has(entity)) return staffEntityCache.get(entity);
  const api = {
    list: (sort, limit, skip) => staffInvoke(entity, 'list', { sort, limit, skip }),
    filter: (query, sort, limit, skip) => staffInvoke(entity, 'filter', { query, sort, limit, skip }),
    get: (id) => staffInvoke(entity, 'get', { id }),
    create: (data) => staffInvoke(entity, 'create', { data }),
    update: (id, data) => staffInvoke(entity, 'update', { id, data }),
    delete: (id) => staffInvoke(entity, 'delete', { id }),
    bulkCreate: (records) => staffInvoke(entity, 'bulkCreate', { records }),
    bulkUpdate: (records) => staffInvoke(entity, 'bulkUpdate', { records }),
  };
  staffEntityCache.set(entity, api);
  return api;
}

const entitiesProxy = new Proxy(sdkClient.entities, {
  get(target, prop) {
    if (typeof prop !== 'string' || !inAdminArea()) return Reflect.get(target, prop);
    return getStaffEntity(prop);
  }
});

export const base44 = new Proxy(sdkClient, {
  get(target, prop) {
    if (prop === 'entities') return entitiesProxy;
    return Reflect.get(target, prop);
  }
});
