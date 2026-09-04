import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const REASONS = ['defective','wrong_item','not_as_described','changed_mind','damaged_shipping','other'];
const TYPES = ['return','exchange'];
const clean = (v, n=1000) => String(v || '').trim().slice(0, n);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const body = await req.json();
    const orderId = clean(body.order_id, 120);
    const productId = clean(body.product_id, 120);
    const reason = REASONS.includes(body.reason) ? body.reason : 'other';
    const type = TYPES.includes(body.type) ? body.type : 'return';
    const description = clean(body.description, 1500);
    const images = Array.isArray(body.images) ? body.images.slice(0, 6).map(v => clean(v, 1200)).filter(Boolean) : [];
    if (!orderId || !productId) return Response.json({ error: 'اختر الطلب والمنتج المطلوب إرجاعه' }, { status: 400 });

    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId, customer_email: user.email }, '-created_date', 1);
    const order = orders[0];
    if (!order) return Response.json({ error: 'الطلب غير موجود أو لا يخص حسابك' }, { status: 404 });
    if (order.status !== 'delivered') return Response.json({ error: 'يمكن طلب الإرجاع بعد تسليم الطلب فقط' }, { status: 400 });
    const item = (order.items || []).find(i => i.product_id === productId);
    if (!item) return Response.json({ error: 'المنتج غير موجود في هذا الطلب' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.ReturnRequest.filter({ order_id: orderId, product_id: productId, customer_email: user.email }, '-created_date', 20);
    const open = existing.find(r => !['rejected','completed','refunded'].includes(r.status));
    if (open) return Response.json({ error: 'يوجد طلب إرجاع مفتوح لهذا المنتج بالفعل', return_id: open.id }, { status: 409 });

    const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email }, '-created_date', 1).catch(() => []);
    const profile = profiles[0];
    const requestNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
    const record = await base44.asServiceRole.entities.ReturnRequest.create({
      request_number: requestNumber,
      order_id: order.id,
      customer_name: order.customer_name || profile?.full_name || user.full_name || '',
      customer_email: user.email,
      customer_phone: order.customer_phone || profile?.phone || '',
      product_id: productId,
      product_title: item.title || '',
      reason,
      description,
      images,
      type,
      status: 'pending',
    });
    return Response.json({ success: true, request: { id: record.id, request_number: requestNumber, status: 'pending' } });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر إرسال طلب الإرجاع' }, { status: 500 });
  }
}
