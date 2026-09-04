import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const rows = await base44.asServiceRole.entities.ReturnRequest.filter({ customer_email: user.email }, '-created_date', 100);
    const returns = rows.map(r => ({
      id: r.id, request_number: r.request_number, order_id: r.order_id,
      product_id: r.product_id, product_title: r.product_title, reason: r.reason,
      description: r.description || '', images: r.images || [], type: r.type,
      status: r.status, refund_amount: r.refund_amount || 0,
      refund_method: r.refund_method || '', created_date: r.created_date,
    }));
    return Response.json({ success: true, returns });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل المرتجعات' }, { status: 500 });
  }
}
