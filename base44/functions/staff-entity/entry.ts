import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

const ENTITY_SECTIONS: Record<string, string> = {
  Product: 'products', Category: 'products', SpecialOffer: 'products', Bundle: 'products', Brand: 'products',
  Order: 'orders', InventoryMovement: 'orders', CashierShift: 'orders', AbandonedCart: 'orders', ReturnRequest: 'orders', Subscription: 'orders',
  CustomerProfile: 'customers', ContactMessage: 'customers', Review: 'customers', ProductReview: 'customers', ClientRating: 'customers', Subscriber: 'customers', Ticket: 'customers',
  StoreSettings: 'settings', HeroSlide: 'settings', AdvertBanner: 'settings', HomeHighlight: 'settings', MarqueeText: 'settings', Gallery: 'settings', VideoGallery: 'settings', GeneratedImage: 'settings', PaymentMethod: 'settings', AuditLog: 'settings', SystemAdmin: 'settings',
  StoreConfig: 'stores', Supplier: 'stores', PurchaseOrder: 'stores',
  Employee: 'employees',
  Expense: 'accounting', SystemTransaction: 'accounting', WalletTransaction: 'accounting',
  Affiliate: 'reports', AffiliateCommission: 'reports',
  Coupon: 'coupons', GiftCard: 'coupons', CouponUsage: 'coupons', GiftCardTransaction: 'coupons',
  BlogPost: 'blog', Survey: 'blog', SurveyResponse: 'blog', Contest: 'blog', ContestEntry: 'blog', SocialPost: 'blog',
  ShippingZone: 'delivery', DeliveryAgent: 'delivery', DeliveryAssignment: 'delivery',
  Notification: 'notifications',
};

const ACTION_OPERATION: Record<string, string> = {
  list: 'view', filter: 'view', get: 'view',
  create: 'add', bulkCreate: 'add',
  update: 'edit', bulkUpdate: 'edit',
  delete: 'delete',
};

// Page-context access. "full" means the entity is native to that section and
// follows the staff member's permission level. "view" means supporting data is
// readable only and can never be mutated through that page context.
const CONTEXT_ENTITY_ACCESS: Record<string, Record<string, 'full' | 'view'>> = {
  settings: {
    StoreSettings: 'full', HeroSlide: 'full', AdvertBanner: 'full', HomeHighlight: 'full', MarqueeText: 'full',
    Gallery: 'full', VideoGallery: 'full', GeneratedImage: 'full', PaymentMethod: 'full', AuditLog: 'view', SystemAdmin: 'view',
    Product: 'view', Category: 'view',
  },
  stores: {
    StoreConfig: 'full', Supplier: 'full', PurchaseOrder: 'full', StoreSettings: 'full',
    Product: 'view', Category: 'view',
  },
  products: {
    Product: 'full', Category: 'full', SpecialOffer: 'full', Bundle: 'full', Brand: 'full', StoreSettings: 'view',
  },
  orders: {
    Order: 'full', InventoryMovement: 'full', CashierShift: 'full', AbandonedCart: 'full', ReturnRequest: 'full', Subscription: 'full',
    Product: 'view', Category: 'view', CustomerProfile: 'view', StoreSettings: 'view',
  },
  customers: {
    CustomerProfile: 'full', ContactMessage: 'full', Review: 'full', ProductReview: 'full', ClientRating: 'full', Subscriber: 'full', Ticket: 'full',
    Product: 'view', Survey: 'view', Order: 'view', StoreSettings: 'view',
  },
  crm: {
    CustomerProfile: 'full', Order: 'view', Product: 'view', StoreSettings: 'view',
  },
  accounting: {
    Expense: 'full', SystemTransaction: 'full', WalletTransaction: 'full',
    Order: 'view', Product: 'view', CustomerProfile: 'view', InventoryMovement: 'view', CashierShift: 'view', StoreSettings: 'view',
  },
  reports: {
    Affiliate: 'full', AffiliateCommission: 'full',
    Order: 'view', Product: 'view', SystemTransaction: 'view', StoreSettings: 'view',
  },
  employees: { Employee: 'full' },
  blog: {
    BlogPost: 'full', Survey: 'full', SurveyResponse: 'full', Contest: 'full', ContestEntry: 'full', SocialPost: 'full',
    Product: 'view', StoreSettings: 'view',
  },
  delivery: {
    ShippingZone: 'full', DeliveryAgent: 'full', DeliveryAssignment: 'full',
    Order: 'view', CustomerProfile: 'view', StoreSettings: 'view',
  },
  coupons: {
    Coupon: 'full', GiftCard: 'full', CouponUsage: 'full', GiftCardTransaction: 'full', Product: 'view', StoreSettings: 'view',
  },
  notifications: {
    Notification: 'full', CustomerProfile: 'view', StoreSettings: 'view',
  },
};

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });

    const body = await req.json();
    const { entity, action, context_section = null, query = {}, sort = null, limit = 50, id = null, data = null, records = null } = body || {};
    if (!entity || !action) return Response.json({ error: 'الكيان والإجراء مطلوبان' }, { status: 400 });

    const baseSection = ENTITY_SECTIONS[entity];
    const operation = ACTION_OPERATION[action];
    if (!baseSection || !operation) return Response.json({ error: 'هذا الإجراء غير مسموح' }, { status: 403 });

    let section = baseSection;
    let contextMode: 'full' | 'view' = 'full';
    if (context_section && CONTEXT_ENTITY_ACCESS[context_section]?.[entity]) {
      section = context_section;
      contextMode = CONTEXT_ENTITY_ACCESS[context_section][entity];
    }
    if (context_section && !CONTEXT_ENTITY_ACCESS[context_section]?.[entity]) {
      return Response.json({ error: 'هذا الكيان غير متاح في سياق الصفحة الحالية' }, { status: 403 });
    }
    if (contextMode === 'view' && operation !== 'view') {
      return Response.json({ error: 'البيانات المساندة متاحة للعرض فقط في هذه الصفحة' }, { status: 403 });
    }

    const access = await requireStaffPermission(base44, user, section, operation);
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });

    // SystemAdmin records are security-sensitive: only the Base44 super admin may read them.
    if (entity === 'SystemAdmin' && !access.superAdmin) {
      return Response.json({ error: 'هذه البيانات متاحة لمدير النظام الرئيسي فقط' }, { status: 403 });
    }

    const entities: any = base44.asServiceRole.entities;
    const api: any = entities[entity];
    if (!api) return Response.json({ error: 'الكيان غير موجود' }, { status: 404 });

    let result: any;
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 1000));

    const hiddenFilter: any = entity === 'Order'
      ? { source: { $ne: 'test' } }
      : entity === 'CustomerProfile'
        ? { is_archived: { $ne: true } }
        : ['Product', 'Category', 'Brand'].includes(entity)
          ? { is_seed: { $ne: true } }
          : entity === 'InventoryMovement'
            ? { is_test: { $ne: true } }
            : null;
    const scopedQuery = hiddenFilter
      ? (query && Object.keys(query).length ? { $and: [hiddenFilter, query] } : hiddenFilter)
      : (query || {});

    switch (action) {
      case 'list':
        result = hiddenFilter
          ? await api.filter(hiddenFilter, sort || undefined, safeLimit)
          : await api.list(sort || undefined, safeLimit);
        break;
      case 'filter':
        result = await api.filter(scopedQuery, sort || undefined, safeLimit);
        break;
      case 'get':
        if (!id) return Response.json({ error: 'المعرف مطلوب' }, { status: 400 });
        result = await api.get(id);
        if ((entity === 'Order' && result?.source === 'test') ||
            (entity === 'CustomerProfile' && result?.is_archived === true) ||
            (['Product', 'Category', 'Brand'].includes(entity) && result?.is_seed === true) ||
            (entity === 'InventoryMovement' && result?.is_test === true)) {
          return Response.json({ error: 'السجل مؤرشف وغير متاح في التشغيل الحالي' }, { status: 404 });
        }
        break;
      case 'create':
        if (!data || typeof data !== 'object') return Response.json({ error: 'البيانات مطلوبة' }, { status: 400 });
        result = await api.create(data);
        break;
      case 'bulkCreate':
        if (!Array.isArray(records) || !records.length) return Response.json({ error: 'السجلات مطلوبة' }, { status: 400 });
        result = await api.bulkCreate(records.slice(0, 500));
        break;
      case 'update':
        if (!id || !data || typeof data !== 'object') return Response.json({ error: 'المعرف والبيانات مطلوبان' }, { status: 400 });
        result = await api.update(id, data);
        break;
      case 'bulkUpdate':
        if (!Array.isArray(records) || !records.length) return Response.json({ error: 'السجلات مطلوبة' }, { status: 400 });
        result = await api.bulkUpdate(records.slice(0, 500));
        break;
      case 'delete':
        if (!id) return Response.json({ error: 'المعرف مطلوب' }, { status: 400 });
        result = await api.delete(id);
        break;
      default:
        return Response.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error?.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
