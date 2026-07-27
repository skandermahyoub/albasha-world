import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_number, customer_phone } = body;

    if (!order_number) {
      return Response.json({ error: 'رقم الطلب مطلوب' }, { status: 400 });
    }
    if (!customer_phone) {
      return Response.json({ error: 'رقم الهاتف مطلوب للتحقق' }, { status: 400 });
    }

    // Use service role to find order (works for both auth users and guests)
    const orders = await base44.asServiceRole.entities.Order.filter(
      { order_number }, '-created_date', 1
    );
    const order = orders[0];
    if (!order) {
      return Response.json({ error: 'لم يتم العثور على الطلب' }, { status: 404 });
    }

    // Verify phone match (compare last 6 digits to handle formatting differences)
    const normalizePhone = (p) => (p || '').replace(/\D/g, '').slice(-9);
    const orderPhone = normalizePhone(order.customer_phone);
    const inputPhone = normalizePhone(customer_phone);
    if (orderPhone !== inputPhone) {
      return Response.json({ error: 'رقم الهاتف لا يطابق الطلب' }, { status: 403 });
    }

    // Return limited data (no sensitive fields)
    return Response.json({
      success: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        items: order.items,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        currency: order.currency,
        shipping_fee: order.shipping_fee,
        created_date: order.created_date,
        status_history: order.status_history,
        customer_name: order.customer_name,
        payment_method: order.payment_method,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}