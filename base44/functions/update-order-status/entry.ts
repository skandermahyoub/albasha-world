import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'orders', 'edit');
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    const { order_id, new_status, performed_by } = await req.json();
    if (!order_id || !new_status) return Response.json({ error: 'معرف الطلب والحالة الجديدة مطلوبان' }, { status: 400 });
    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
    const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'shipped', 'delivered', 'cancelled'], preparing: ['shipped', 'delivered', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: ['returned'], cancelled: [], returned: [] };
    if (!(transitions[order.status] || []).includes(new_status)) return Response.json({ error: `لا يمكن الانتقال من "${order.status}" إلى "${new_status}"` }, { status: 400 });
    const history = [...(order.status_history || []), { status: new_status, date: new Date().toISOString() }];
    const updateData = { status: new_status, status_history: history };
    if (new_status === 'confirmed' && !order.assigned_employee) updateData.assigned_employee = performed_by || user.full_name || user.email;
    if (new_status === 'confirmed' && !order.stock_deducted) {
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (!product) continue;
        const stockBefore = Number(product.stock) || 0;
        const stockAfter = Math.max(0, stockBefore - item.quantity);
        await base44.asServiceRole.entities.Product.update(product.id, { stock: stockAfter });
        await base44.asServiceRole.entities.InventoryMovement.create({ product_id: product.id, product_title: item.title || product.title, sku: product.sku || '', type: 'sale', quantity: item.quantity, stock_before: stockBefore, stock_after: stockAfter, unit_price: item.price, total: (item.price || 0) * item.quantity, order_id: order.id, order_number: order.order_number, note: 'تأكيد طلب' });
      }
      updateData.stock_deducted = true;
    }
    if (new_status === 'cancelled' && order.stock_deducted) {
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (!product) continue;
        const stockBefore = Number(product.stock) || 0;
        await base44.asServiceRole.entities.Product.update(product.id, { stock: stockBefore + item.quantity });
      }
      updateData.stock_deducted = false;
    }
    if (new_status === 'delivered' && !order.sales_updated) {
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (product) await base44.asServiceRole.entities.Product.update(product.id, { sales_count: (Number(product.sales_count) || 0) + item.quantity });
      }
      await base44.asServiceRole.entities.SystemTransaction.create({ type: 'order_profit', amount: order.total || 0, order_number: order.order_number, order_subtotal: order.subtotal || 0, order_discount: order.discount || 0, performed_by: performed_by || user.full_name || user.email, reason: `تسليم طلب ${order.order_number}`, date: new Date().toISOString() });
      const commissions = await base44.asServiceRole.entities.AffiliateCommission.filter({ order_id: order.id, status: 'pending' });
      for (const commission of commissions) {
        await base44.asServiceRole.entities.AffiliateCommission.update(commission.id, { status: 'earned' });
        const affiliate = await base44.asServiceRole.entities.Affiliate.get(commission.affiliate_id).catch(() => null);
        if (affiliate) await base44.asServiceRole.entities.Affiliate.update(affiliate.id, { total_commission: (affiliate.total_commission || 0) + commission.commission_amount });
      }
      updateData.sales_updated = true;
      updateData.commission_calculated = true;
    }
    if (new_status === 'returned') {
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (product) await base44.asServiceRole.entities.Product.update(product.id, { stock: (Number(product.stock) || 0) + item.quantity, sales_count: Math.max(0, (Number(product.sales_count) || 0) - item.quantity) });
      }
      await base44.asServiceRole.entities.SystemTransaction.create({ type: 'order_return', amount: -(order.total || 0), order_number: order.order_number, order_subtotal: order.subtotal || 0, order_discount: order.discount || 0, performed_by: performed_by || user.full_name || user.email, reason: `استرجاع طلب ${order.order_number}`, date: new Date().toISOString() });
      const commissions = await base44.asServiceRole.entities.AffiliateCommission.filter({ order_id: order.id, status: 'earned' });
      for (const commission of commissions) {
        await base44.asServiceRole.entities.AffiliateCommission.update(commission.id, { status: 'reversed' });
        const affiliate = await base44.asServiceRole.entities.Affiliate.get(commission.affiliate_id).catch(() => null);
        if (affiliate) await base44.asServiceRole.entities.Affiliate.update(affiliate.id, { total_commission: Math.max(0, (affiliate.total_commission || 0) - commission.commission_amount) });
      }
      updateData.stock_deducted = false;
      updateData.return_processed = true;
    }
    await base44.asServiceRole.entities.Order.update(order.id, updateData);
    const eventKey = `order:${order.id}:${new_status}`;
    const existing = await base44.asServiceRole.entities.Notification.filter({ event_key: eventKey, customer_email: order.customer_email });
    if (order.customer_email && !existing.length) {
      const messages = { confirmed: 'تم تأكيد طلبك وجارٍ تجهيزه.', preparing: 'يجري الآن تجهيز طلبك.', shipped: 'تم شحن طلبك وهو في طريقه إليك.', delivered: 'تم تسليم طلبك بنجاح. شكراً لتسوقك معنا.', cancelled: 'تم إلغاء طلبك. تواصل معنا إذا احتجت إلى مساعدة.', returned: 'تم تسجيل إرجاع طلبك بنجاح.' };
      await base44.asServiceRole.entities.Notification.create({ title: `تحديث الطلب ${order.order_number}`, message: messages[new_status] || 'تم تحديث حالة طلبك.', icon: new_status === 'delivered' ? '✅' : '📦', target_type: 'order', target_id: order.id, target_route: `/orders/${order.order_number}`, event_key: eventKey, is_read: false, type: new_status === 'cancelled' ? 'alert' : 'info', customer_email: order.customer_email, interval_minutes: 5, sort_order: 0, is_active: true });
    }
    return Response.json({ success: true, order: { id: order.id, order_number: order.order_number, status: new_status } });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}