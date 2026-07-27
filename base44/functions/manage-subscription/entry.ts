import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const FREQ_DAYS = { weekly: 7, biweekly: 14, monthly: 30 };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, product_id, quantity, frequency, subscription_id } = body;

    // Must be authenticated
    let user;
    try { user = await base44.auth.me(); } catch {}
    if (!user) {
      return Response.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    // ── CREATE ──
    if (action === 'create') {
      if (!product_id) {
        return Response.json({ error: 'المنتج مطلوب' }, { status: 400 });
      }

      // Read product from DB — don't trust frontend
      const products = await base44.asServiceRole.entities.Product.filter({ id: product_id });
      const product = products[0];
      if (!product) {
        return Response.json({ error: 'المنتج غير موجود' }, { status: 404 });
      }
      if (product.status !== 'active') {
        return Response.json({ error: 'المنتج غير متاح لل اشتراك' }, { status: 400 });
      }
      if (!product.is_subscribable) {
        return Response.json({ error: 'المنتج لا يدعم الاشتراك' }, { status: 400 });
      }

      const freq = frequency || 'monthly';
      if (!FREQ_DAYS[freq]) {
        return Response.json({ error: 'تكرار غير صحيح' }, { status: 400 });
      }

      // Prevent duplicate active subscription for same product + frequency
      const existing = await base44.asServiceRole.entities.Subscription.filter({
        user_email: user.email,
        product_id,
        frequency: freq,
        status: 'active',
      });
      if (existing.length > 0) {
        return Response.json({ error: 'لديك اشتراك نشط على هذا المنتج بنفس التكرار' }, { status: 400 });
      }

      // Server-side discount calculation — user cannot set their own discount
      const discountPercent = product.subscription_discount || 10;
      const qty = Math.max(1, parseInt(quantity) || 1);
      const discountedPrice = Math.round((product.price || 0) * (1 - discountPercent / 100) * 100) / 100;
      const days = FREQ_DAYS[freq];
      const nextDelivery = new Date(Date.now() + days * 86400000).toISOString();

      const sub = await base44.asServiceRole.entities.Subscription.create({
        user_email: user.email,
        customer_name: user.full_name || '',
        product_id,
        product_title: product.title,
        product_image: product.image || '',
        quantity: qty,
        price: discountedPrice,
        frequency: freq,
        discount_percent: discountPercent,
        next_delivery: nextDelivery,
        status: 'active',
      });

      return Response.json({
        success: true,
        subscription: {
          id: sub.id,
          product_title: product.title,
          price: discountedPrice,
          frequency: freq,
          next_delivery: nextDelivery,
        },
      });
    }

    // ── CANCEL ──
    if (action === 'cancel') {
      if (!subscription_id) {
        return Response.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 });
      }

      // Use user-scoped SDK so RLS ensures ownership
      const subs = await base44.entities.Subscription.filter({ id: subscription_id });
      const sub = subs[0];
      if (!sub) {
        return Response.json({ error: 'الاشتراك غير موجود' }, { status: 404 });
      }
      if (sub.status === 'cancelled') {
        return Response.json({ success: true, message: 'الاشتراك ملغى مسبقاً' });
      }

      await base44.asServiceRole.entities.Subscription.update(subscription_id, { status: 'cancelled' });

      return Response.json({ success: true, message: 'تم إلغاء الاشتراك' });
    }

    // ── PAUSE ──
    if (action === 'pause') {
      if (!subscription_id) {
        return Response.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 });
      }
      const subs = await base44.entities.Subscription.filter({ id: subscription_id });
      const sub = subs[0];
      if (!sub) {
        return Response.json({ error: 'الاشتراك غير موجود' }, { status: 404 });
      }
      if (sub.status !== 'active') {
        return Response.json({ error: 'لا يمكن إيقاف اشتراك غير نشط' }, { status: 400 });
      }
      await base44.asServiceRole.entities.Subscription.update(subscription_id, { status: 'paused' });
      return Response.json({ success: true, message: 'تم إيقاف الاشتراك' });
    }

    // ── RESUME ──
    if (action === 'resume') {
      if (!subscription_id) {
        return Response.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 });
      }
      const subs = await base44.entities.Subscription.filter({ id: subscription_id });
      const sub = subs[0];
      if (!sub) {
        return Response.json({ error: 'الاشتراك غير موجود' }, { status: 404 });
      }
      if (sub.status !== 'paused') {
        return Response.json({ error: 'لا يمكن استئناف اشتراك غير موقوف' }, { status: 400 });
      }
      // Calculate next delivery from now
      const days = FREQ_DAYS[sub.frequency] || 30;
      const nextDelivery = new Date(Date.now() + days * 86400000).toISOString();
      await base44.asServiceRole.entities.Subscription.update(subscription_id, {
        status: 'active',
        next_delivery: nextDelivery,
      });
      return Response.json({ success: true, message: 'تم استئناف الاشتراك' });
    }

    return Response.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}