import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const { order_id, rating } = await req.json();
    const value = Number(rating);
    if (!order_id || !Number.isInteger(value) || value < 1 || value > 5) {
      return Response.json({ error: 'التقييم غير صالح' }, { status: 400 });
    }
    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
    if (!order.customer_email || order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ error: 'لا تملك صلاحية تقييم هذا الطلب' }, { status: 403 });
    }
    if (order.status !== 'delivered') return Response.json({ error: 'يمكن تقييم الطلب بعد التسليم فقط' }, { status: 400 });
    await base44.asServiceRole.entities.Order.update(order.id, { delivery_rating: value });
    return Response.json({ success: true, rating: value });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر حفظ التقييم' }, { status: 500 });
  }
}
