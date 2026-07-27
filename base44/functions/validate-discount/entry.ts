import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { code, subtotal, store_key } = body;

    if (!code) {
      return Response.json({ error: 'الكود مطلوب' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    // Try coupon first
    const coupons = await base44.asServiceRole.entities.Coupon.filter({
      code: upperCode, is_active: true
    });
    const coupon = coupons[0];

    if (coupon) {
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return Response.json({ valid: false, type: 'coupon', message: 'هذا الكود لم يبدأ بعد' });
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return Response.json({ valid: false, type: 'coupon', message: 'انتهت صلاحية الكود' });
      }
      if (coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses) {
        return Response.json({ valid: false, type: 'coupon', message: 'تم استخدام الكود بالكامل' });
      }
      const sub = Number(subtotal) || 0;
      if (coupon.min_order_value > 0 && sub < coupon.min_order_value) {
        return Response.json({ valid: false, type: 'coupon', message: `الحد الأدنى للطلب ${coupon.min_order_value}$` });
      }

      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = sub * (coupon.discount_value || 0) / 100;
      } else {
        discountAmount = Math.min(coupon.discount_value || 0, sub);
      }

      return Response.json({
        valid: true,
        type: 'coupon',
        coupon_id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: Math.round(discountAmount * 100) / 100,
        store_key: coupon.store_key,
        message: 'كوبون صالح'
      });
    }

    // Not a coupon — try gift card
    const cards = await base44.asServiceRole.entities.GiftCard.filter({
      code: upperCode, status: 'active'
    });
    const card = cards[0];

    if (card) {
      if (card.expires_at && new Date(card.expires_at) < new Date()) {
        return Response.json({ valid: false, type: 'gift_card', message: 'انتهت صلاحية بطاقة الهدايا' });
      }
      const remaining = (card.amount || 0) - (card.used_amount || 0);
      if (remaining <= 0) {
        return Response.json({ valid: false, type: 'gift_card', message: 'رصيد البطاقة مستنفد' });
      }
      const sub = Number(subtotal) || 0;
      const usable = Math.min(remaining, sub);

      return Response.json({
        valid: true,
        type: 'gift_card',
        gift_card_id: card.id,
        code: card.code,
        balance: remaining,
        usable_amount: Math.round(usable * 100) / 100,
        message: 'بطاقة هدايا صالحة'
      });
    }

    return Response.json({ valid: false, type: 'unknown', message: 'كود غير صحيح أو غير مفعّل' });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}