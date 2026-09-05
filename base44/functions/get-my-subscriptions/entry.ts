import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });

    const rows = await base44.asServiceRole.entities.Subscription.filter(
      { user_email: user.email },
      '-created_date',
      200
    );

    const subscriptions = rows.map((sub: any) => ({
      id: sub.id,
      product_id: sub.product_id,
      product_title: sub.product_title || 'منتج',
      product_image: sub.product_image || '',
      quantity: Number(sub.quantity) || 1,
      price: Number(sub.price) || 0,
      frequency: sub.frequency || 'monthly',
      discount_percent: Number(sub.discount_percent) || 0,
      next_delivery: sub.next_delivery || null,
      status: sub.status || 'active',
      created_date: sub.created_date,
    }));

    return Response.json({ success: true, subscriptions });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تحميل الاشتراكات' }, { status: 500 });
  }
}
