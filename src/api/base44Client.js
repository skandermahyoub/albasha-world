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

async function staffInvoke(entity, action, payload = {}) {
  const res = await sdkClient.functions.invoke('staff-entity', { entity, action, ...payload });
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
    list: (sort, limit) => staffInvoke(entity, 'list', { sort, limit }),
    filter: (query, sort, limit) => staffInvoke(entity, 'filter', { query, sort, limit }),
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
