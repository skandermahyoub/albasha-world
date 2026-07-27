import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function getVisitorKey(req) {
  const ip = req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  return `${ip}::${ua.slice(0, 50)}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items, cart_total, customer_email, customer_name, customer_phone } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'السلة فارغة' }, { status: 400 });
    }

    // Determine identity
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    const visitorKey = getVisitorKey(req);
    const email = user?.email || customer_email || '';
    const name = user?.full_name || customer_name || '';
    const phone = customer_phone || '';

    // Find existing pending cart for this user/visitor
    let existingCart = null;
    if (email) {
      const carts = await base44.asServiceRole.entities.AbandonedCart.filter({
        customer_email: email, status: 'pending'
      });
      existingCart = carts[0];
    }
    if (!existingCart) {
      const carts = await base44.asServiceRole.entities.AbandonedCart.filter({
        visitor_key: visitorKey, status: 'pending'
      });
      existingCart = carts[0];
    }

    const cartData = {
      customer_email: email,
      customer_name: name,
      customer_phone: phone,
      visitor_key: visitorKey,
      items: items.map(i => ({
        product_id: i.product_id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        image: i.image || '',
      })),
      cart_total: cart_total || 0,
      status: 'pending',
      reminder_sent: false,
      reminder_method: 'none',
    };

    if (existingCart) {
      // Update existing — prevent duplicate records
      cartData.recovery_token = existingCart.recovery_token || generateToken();
      await base44.asServiceRole.entities.AbandonedCart.update(existingCart.id, cartData);
      return Response.json({
        success: true,
        cart_id: existingCart.id,
        recovery_token: cartData.recovery_token,
        message: 'تم تحديث السلة المتروكة',
      });
    } else {
      // Create new
      const token = generateToken();
      cartData.recovery_token = token;
      const cart = await base44.asServiceRole.entities.AbandonedCart.create(cartData);
      return Response.json({
        success: true,
        cart_id: cart.id,
        recovery_token: token,
        message: 'تم تسجيل السلة المتروكة',
      });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}