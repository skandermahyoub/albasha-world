import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_number, customer_phone } = body;
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (!order_number) return Response.json({ error: 'رقم الطلب مطلوب' }, { status: 400 });
    if (!user?.email && !customer_phone) return Response.json({ error: 'رقم الهاتف مطلوب للتحقق' }, { status: 400 });

    // Use service role to find order (works for both auth users and guests)
    const orders = await base44.asServiceRole.entities.Order.filter(
      { order_number }, '-created_date', 1
    );
    const order = orders[0];
    if (!order || order.source === 'test') {
      return Response.json({ error: 'لم يتم العثور على الطلب' }, { status: 404 });
    }

    if (user?.email) {
      if (!order.customer_email || order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
        return Response.json({ error: 'لا تملك صلاحية الوصول إلى هذا الطلب' }, { status: 403 });
      }
    } else {
      const normalizePhone = (value) => (value || '').replace(/\D/g, '').slice(-9);
      if (normalizePhone(order.customer_phone) !== normalizePhone(customer_phone)) {
        return Response.json({ error: 'رقم الهاتف لا يطابق الطلب' }, { status: 403 });
      }
    }

    // Return limited data (no sensitive fields)
    return Response.json({
      success: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        items: (order.items || []).map((item: any) => ({ product_id: item.product_id, title: item.title, price: item.price, quantity: item.quantity, image: item.image, store_key: item.store_key || '' })),
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        currency: order.currency,
        shipping_fee: order.shipping_fee,
        created_date: order.created_date,
        status_history: order.status_history,
        customer_name: order.customer_name,
        payment_method: order.payment_method,
        address: order.address,
        shipping_zone: order.shipping_zone,
        notes: order.notes,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}