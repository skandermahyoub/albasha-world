import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: user.email }, '-created_date', 100);
    const safeOrders = orders.map((order: any) => ({
      ...order,
      items: (order.items || []).map((item: any) => ({ product_id: item.product_id, title: item.title, price: item.price, quantity: item.quantity, image: item.image, store_key: item.store_key || '' })),
    }));
    return Response.json({ success: true, orders: safeOrders });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل الطلبات' }, { status: 500 });
  }
}