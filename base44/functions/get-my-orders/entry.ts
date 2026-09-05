import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: user.email, source: { $ne: 'test' }, admin_archived: { $ne: true } }, '-created_date', 100);
    const safeOrders = orders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: (order.items || []).map((item: any) => ({ product_id: item.product_id, title: item.title, price: item.price, quantity: item.quantity, image: item.image, store_key: item.store_key || '' })),
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      amount_due: order.amount_due,
      currency: order.currency,
      status: order.status,
      status_history: order.status_history || [],
      payment_method: order.payment_method,
      address: order.address,
      shipping_zone: order.shipping_zone,
      shipping_fee: order.shipping_fee,
      notes: order.notes,
      expected_delivery: order.expected_delivery,
      delivery_rating: order.delivery_rating,
      source: order.source,
      created_date: order.created_date,
    }));
    return Response.json({ success: true, orders: safeOrders });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل الطلبات' }, { status: 500 });
  }
}