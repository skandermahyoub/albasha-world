import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { recovery_token } = body;

    if (!recovery_token) {
      return Response.json({ error: 'رمز الاستعادة مطلوب' }, { status: 400 });
    }

    // Find cart by token
    const carts = await base44.asServiceRole.entities.AbandonedCart.filter({
      recovery_token, status: 'pending'
    });
    const cart = carts[0];

    if (!cart) {
      return Response.json({ error: 'رابط الاستعادة غير صالح أو انتهت مدته' }, { status: 404 });
    }

    // Fetch current product data — don't trust stored prices
    const productIds = [...new Set((cart.items || []).map(i => i.product_id).filter(Boolean))];
    const products = await Promise.all(
      productIds.map(id =>
        base44.asServiceRole.entities.Product.get(id).catch(() => null)
      )
    );
    const productMap = {};
    products.forEach(p => { if (p) productMap[p.id] = p; });

    // Build recovered items with current prices, marking unavailable ones
    const recoveredItems = (cart.items || []).map(item => {
      const product = productMap[item.product_id];
      const available = product && product.status === 'active' && (product.stock === undefined || product.stock > 0);
      return {
        product_id: item.product_id,
        title: product?.title || item.title,
        price: product?.price ?? item.price, // Current price from DB
        quantity: item.quantity,
        image: product?.image || item.image || '',
        available: !!available,
        unavailable_reason: !product ? 'تم حذف المنتج' :
                            product.status !== 'active' ? 'المنتج لم يعد متاحاً' :
                            (product.stock !== undefined && product.stock <= 0) ? 'نفد المخزون' : null,
      };
    });

    const cartTotal = recoveredItems.reduce((sum, i) => sum + (i.available ? i.price * i.quantity : 0), 0);

    return Response.json({
      success: true,
      cart_id: cart.id,
      customer_email: cart.customer_email || '',
      customer_name: cart.customer_name || '',
      items: recoveredItems,
      cart_total: cartTotal,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}