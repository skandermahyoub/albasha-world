import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'shipped', 'delivered', 'cancelled'],
  preparing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

async function restoreStock(base44: any, order: any, note: string) {
  for (const item of order.items || []) {
    const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
    if (!product) continue;
    const before = Number(product.stock) || 0;
    const after = before + (Number(item.quantity) || 0);
    await base44.asServiceRole.entities.Product.update(product.id, { stock: after });
    await base44.asServiceRole.entities.InventoryMovement.create({
      product_id: product.id,
      product_title: item.title || product.title,
      sku: product.sku || '',
      type: 'return',
      quantity: Number(item.quantity) || 0,
      stock_before: before,
      stock_after: after,
      unit_price: Number(item.price) || 0,
      total: (Number(item.price) || 0) * (Number(item.quantity) || 0),
      order_id: order.id,
      order_number: order.order_number,
      note,
    });
  }
}

async function reverseFinancials(base44: any, order: any, actor: string, reason: string) {
  if (order.financial_reversed) return;
  const email = order.customer_email || '';

  // Wallet: restore only the amount actually paid from the wallet.
  let walletUsed = Number(order.wallet_used) || 0;
  if (!walletUsed && email) {
    const purchases = await base44.asServiceRole.entities.WalletTransaction.filter({ customer_email: email, type: 'purchase', order_id: order.order_number }, '-created_date', 5).catch(() => []);
    walletUsed = purchases.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
  }
  if (walletUsed > 0 && email) {
    const priorRefund = await base44.asServiceRole.entities.WalletTransaction.filter({ customer_email: email, type: 'refund', order_id: order.order_number }, '-created_date', 1).catch(() => []);
    if (!priorRefund.length) {
      const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: email, is_archived: false }, '-created_date', 1).catch(() => []);
      let profile = profiles[0];
      if (!profile) profile = await base44.asServiceRole.entities.CustomerProfile.create({ user_email: email, is_archived: false, name: order.customer_name || '', full_name: order.customer_name || '', wallet_balance: 0 });
      const newBalance = (Number(profile.wallet_balance) || 0) + walletUsed;
      await base44.asServiceRole.entities.CustomerProfile.update(profile.id, { wallet_balance: newBalance });
      await base44.asServiceRole.entities.WalletTransaction.create({ customer_email: email, type: 'refund', amount: walletUsed, balance_after: newBalance, description: `${reason} الطلب #${order.order_number}`, order_id: order.order_number, status: 'completed' });
    }
  }

  // Coupon: free the use slot once the order is cancelled/fully returned.
  const usages = await base44.asServiceRole.entities.CouponUsage.filter({ order_id: order.id, status: 'active' }).catch(() => []);
  for (const usage of usages) {
    await base44.asServiceRole.entities.CouponUsage.update(usage.id, { status: 'reversed' });
    const coupon = await base44.asServiceRole.entities.Coupon.get(usage.coupon_id).catch(() => null);
    if (coupon) await base44.asServiceRole.entities.Coupon.update(coupon.id, { used_count: Math.max(0, (Number(coupon.used_count) || 0) - 1) });
  }

  // Gift card: restore the consumed balance and record a refund transaction.
  const giftPurchases = await base44.asServiceRole.entities.GiftCardTransaction.filter({ order_id: order.id, type: 'purchase' }).catch(() => []);
  for (const txn of giftPurchases) {
    const prior = await base44.asServiceRole.entities.GiftCardTransaction.filter({ order_id: order.id, gift_card_id: txn.gift_card_id, type: 'refund' }, '-created_date', 1).catch(() => []);
    if (prior.length) continue;
    const card = await base44.asServiceRole.entities.GiftCard.get(txn.gift_card_id).catch(() => null);
    if (!card) continue;
    const balanceBefore = (Number(card.amount) || 0) - (Number(card.used_amount) || 0);
    const newUsedAmount = Math.max(0, (Number(card.used_amount) || 0) - (Number(txn.amount) || 0));
    const balanceAfter = (Number(card.amount) || 0) - newUsedAmount;
    await base44.asServiceRole.entities.GiftCard.update(card.id, { used_amount: newUsedAmount, status: 'active' });
    await base44.asServiceRole.entities.GiftCardTransaction.create({ gift_card_id: card.id, gift_card_code: card.code, order_id: order.id, order_number: order.order_number, amount: Number(txn.amount) || 0, balance_before: balanceBefore, balance_after: balanceAfter, type: 'refund', idempotency_key: `refund:${order.id}:${txn.id}` });
  }

  // Loyalty: return spent points and remove points earned by this order.
  if (email) {
    const records = await base44.asServiceRole.entities.LoyaltyPoints.filter({ user_email: email }, '-created_date', 1).catch(() => []);
    const record = records[0];
    if (record) {
      const tag = `#${order.order_number}`;
      const history = [...(record.history || [])];
      const inferredSpent = history.filter((h: any) => Number(h.points) < 0 && String(h.description || '').includes(tag)).reduce((sum: number, h: any) => sum + Math.abs(Number(h.points) || 0), 0);
      const inferredEarned = history.filter((h: any) => Number(h.points) > 0 && String(h.description || '').includes(tag)).reduce((sum: number, h: any) => sum + (Number(h.points) || 0), 0);
      const spent = Number(order.loyalty_points_spent) || inferredSpent;
      const earned = Number(order.loyalty_points_earned) || inferredEarned;
      if (spent > 0 || earned > 0) {
        const nextPoints = Math.max(0, (Number(record.points) || 0) + spent - earned);
        const nextSpent = Math.max(0, (Number(record.total_spent) || 0) - spent);
        const nextEarned = Math.max(0, (Number(record.total_earned) || 0) - earned);
        if (spent > 0) history.push({ action: 'refund', points: spent, date: new Date().toISOString(), description: `إعادة نقاط الطلب #${order.order_number}` });
        if (earned > 0) history.push({ action: 'reverse', points: -earned, date: new Date().toISOString(), description: `عكس نقاط الطلب #${order.order_number}` });
        await base44.asServiceRole.entities.LoyaltyPoints.update(record.id, { points: nextPoints, total_spent: nextSpent, total_earned: nextEarned, history });
      }
    }
  }

  // Customer metrics are counted only on delivery. Legacy orders that already earned points
  // are also treated as having had their customer metrics counted.
  if (email && (order.customer_metrics_updated || Number(order.loyalty_points_earned) > 0)) {
    const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: email, is_archived: false }, '-created_date', 1).catch(() => []);
    const profile = profiles[0];
    if (profile) {
      await base44.asServiceRole.entities.CustomerProfile.update(profile.id, {
        total_spent: Math.max(0, (Number(profile.total_spent) || 0) - (Number(order.total) || 0)),
        orders_count: Math.max(0, (Number(profile.orders_count) || 0) - 1),
      });
    }
  }

  // Affiliate: reverse pending/earned commission and sale totals when they were recorded.
  const commissions = await base44.asServiceRole.entities.AffiliateCommission.filter({ order_id: order.id }).catch(() => []);
  for (const commission of commissions) {
    if (commission.status === 'reversed') continue;
    const affiliate = await base44.asServiceRole.entities.Affiliate.get(commission.affiliate_id).catch(() => null);
    const saleWasRecorded = commission.sale_recorded !== false; // undefined = legacy flow where total_sales was recorded at checkout
    if (affiliate) {
      const updates: any = {};
      if (saleWasRecorded) updates.total_sales = Math.max(0, (Number(affiliate.total_sales) || 0) - (Number(commission.sale_amount) || 0));
      if (commission.status === 'earned') updates.total_commission = Math.max(0, (Number(affiliate.total_commission) || 0) - (Number(commission.commission_amount) || 0));
      if (Object.keys(updates).length) await base44.asServiceRole.entities.Affiliate.update(affiliate.id, updates);
    }
    await base44.asServiceRole.entities.AffiliateCommission.update(commission.id, { status: 'reversed', sale_recorded: false });
  }

  await base44.asServiceRole.entities.Order.update(order.id, { financial_reversed: true, customer_metrics_updated: false, loyalty_points_earned: 0 });
}

export default async function(req: Request) {
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
    if (!(TRANSITIONS[order.status] || []).includes(new_status)) return Response.json({ error: `لا يمكن الانتقال من "${order.status}" إلى "${new_status}"` }, { status: 400 });

    const actor = performed_by || user.full_name || user.email;
    const history = [...(order.status_history || []), { status: new_status, date: new Date().toISOString() }];
    const updateData: any = { status: new_status, status_history: history };
    if (new_status === 'confirmed' && !order.assigned_employee) updateData.assigned_employee = actor;

    // Reserve/deduct stock only after confirmation and reject overselling.
    if (new_status === 'confirmed' && !order.stock_deducted) {
      const productRows: any[] = [];
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (!product) return Response.json({ error: `تعذر العثور على المنتج: ${item.title || item.product_id}` }, { status: 409 });
        const available = Number(product.stock);
        const requested = Number(item.quantity) || 0;
        if (Number.isFinite(available) && available < requested) return Response.json({ error: `المخزون غير كافٍ للمنتج ${product.title} — المتاح ${available}` }, { status: 409 });
        productRows.push({ item, product });
      }
      for (const { item, product } of productRows) {
        const before = Number(product.stock) || 0;
        const requested = Number(item.quantity) || 0;
        const after = before - requested;
        await base44.asServiceRole.entities.Product.update(product.id, { stock: after });
        await base44.asServiceRole.entities.InventoryMovement.create({ product_id: product.id, product_title: item.title || product.title, sku: product.sku || '', type: 'sale', quantity: requested, stock_before: before, stock_after: after, unit_price: Number(item.price) || 0, total: (Number(item.price) || 0) * requested, order_id: order.id, order_number: order.order_number, note: 'تأكيد طلب' });
      }
      updateData.stock_deducted = true;
    }

    if (new_status === 'cancelled') {
      if (order.stock_deducted) {
        await restoreStock(base44, order, 'إلغاء الطلب وإعادة المخزون');
        updateData.stock_deducted = false;
      }
      await reverseFinancials(base44, order, actor, 'إلغاء');
      updateData.financial_reversed = true;
      updateData.customer_metrics_updated = false;
      updateData.loyalty_points_earned = 0;
    }

    if (new_status === 'delivered' && !order.sales_updated) {
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (product) await base44.asServiceRole.entities.Product.update(product.id, { sales_count: (Number(product.sales_count) || 0) + (Number(item.quantity) || 0) });
      }

      const existingRevenue = await base44.asServiceRole.entities.SystemTransaction.filter({ type: 'order_profit', order_number: order.order_number }, '-created_date', 1).catch(() => []);
      if (!existingRevenue.length) {
        await base44.asServiceRole.entities.SystemTransaction.create({ type: 'order_profit', amount: Number(order.total) || 0, order_number: order.order_number, order_subtotal: Number(order.subtotal) || 0, order_discount: Number(order.discount) || 0, performed_by: actor, reason: `إيراد تسليم الطلب ${order.order_number}`, date: new Date().toISOString() });
      }

      const commissions = await base44.asServiceRole.entities.AffiliateCommission.filter({ order_id: order.id, status: 'pending' }).catch(() => []);
      for (const commission of commissions) {
        const affiliate = await base44.asServiceRole.entities.Affiliate.get(commission.affiliate_id).catch(() => null);
        if (affiliate) {
          const updates: any = { total_commission: (Number(affiliate.total_commission) || 0) + (Number(commission.commission_amount) || 0) };
          if (commission.sale_recorded === false) updates.total_sales = (Number(affiliate.total_sales) || 0) + (Number(commission.sale_amount) || 0);
          await base44.asServiceRole.entities.Affiliate.update(affiliate.id, updates);
        }
        await base44.asServiceRole.entities.AffiliateCommission.update(commission.id, { status: 'earned', sale_recorded: true });
      }

      let earnedPoints = 0;
      if (order.customer_email) {
        earnedPoints = Math.floor(Number(order.total) || 0);
        if (earnedPoints > 0) {
          const lps = await base44.asServiceRole.entities.LoyaltyPoints.filter({ user_email: order.customer_email }, '-created_date', 1).catch(() => []);
          const lp = lps[0];
          const entry = { action: 'earn', points: earnedPoints, date: new Date().toISOString(), description: `طلب #${order.order_number}` };
          if (lp) {
            await base44.asServiceRole.entities.LoyaltyPoints.update(lp.id, { points: (Number(lp.points) || 0) + earnedPoints, total_earned: (Number(lp.total_earned) || 0) + earnedPoints, history: [...(lp.history || []), entry] });
          } else {
            await base44.asServiceRole.entities.LoyaltyPoints.create({ user_email: order.customer_email, points: earnedPoints, total_earned: earnedPoints, total_spent: 0, history: [entry] });
          }
        }

        const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: order.customer_email, is_archived: false }, '-created_date', 1).catch(() => []);
        let profile = profiles[0];
        if (!profile) profile = await base44.asServiceRole.entities.CustomerProfile.create({ user_email: order.customer_email, is_archived: false, name: order.customer_name || '', full_name: order.customer_name || '', phone: order.customer_phone || '', address: order.address || '' });
        await base44.asServiceRole.entities.CustomerProfile.update(profile.id, { total_spent: (Number(profile.total_spent) || 0) + (Number(order.total) || 0), orders_count: (Number(profile.orders_count) || 0) + 1 });
      }

      updateData.sales_updated = true;
      updateData.commission_calculated = true;
      updateData.customer_metrics_updated = true;
      updateData.loyalty_points_earned = earnedPoints;
      updateData.financial_reversed = false;
    }

    if (new_status === 'returned') {
      await restoreStock(base44, order, 'مرتجع كامل وإعادة المخزون');
      for (const item of order.items || []) {
        const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
        if (product) await base44.asServiceRole.entities.Product.update(product.id, { sales_count: Math.max(0, (Number(product.sales_count) || 0) - (Number(item.quantity) || 0)) });
      }
      const existingReturn = await base44.asServiceRole.entities.SystemTransaction.filter({ type: 'order_return', order_number: order.order_number }, '-created_date', 1).catch(() => []);
      if (!existingReturn.length) {
        const original = await base44.asServiceRole.entities.SystemTransaction.filter({ type: 'order_profit', order_number: order.order_number }, '-created_date', 1).catch(() => []);
        await base44.asServiceRole.entities.SystemTransaction.create({ type: 'order_return', amount: -(Number(order.total) || 0), order_number: order.order_number, order_subtotal: Number(order.subtotal) || 0, order_discount: Number(order.discount) || 0, performed_by: actor, reason: `استرجاع الطلب ${order.order_number}`, date: new Date().toISOString(), reference_transaction_id: original[0]?.id || '' });
      }
      await reverseFinancials(base44, order, actor, 'استرجاع');
      updateData.stock_deducted = false;
      updateData.sales_updated = false;
      updateData.commission_calculated = false;
      updateData.return_processed = true;
      updateData.financial_reversed = true;
      updateData.customer_metrics_updated = false;
      updateData.loyalty_points_earned = 0;
    }

    await base44.asServiceRole.entities.Order.update(order.id, updateData);

    const eventKey = `order:${order.id}:${new_status}`;
    const existing = order.customer_email ? await base44.asServiceRole.entities.Notification.filter({ event_key: eventKey, customer_email: order.customer_email }).catch(() => []) : [];
    if (order.customer_email && !existing.length) {
      const messages: Record<string, string> = { confirmed: 'تم تأكيد طلبك وجارٍ تجهيزه.', preparing: 'يجري الآن تجهيز طلبك.', shipped: 'تم شحن طلبك وهو في طريقه إليك.', delivered: 'تم تسليم طلبك بنجاح. شكراً لتسوقك معنا.', cancelled: 'تم إلغاء طلبك وإعادة أي أرصدة رقمية مرتبطة به.', returned: 'تم تسجيل إرجاع طلبك وعكس التسويات المرتبطة به.' };
      await base44.asServiceRole.entities.Notification.create({ title: `تحديث الطلب ${order.order_number}`, message: messages[new_status] || 'تم تحديث حالة طلبك.', icon: new_status === 'delivered' ? '✅' : '📦', target_type: 'order', target_id: order.id, target_route: `/orders/${order.order_number}`, event_key: eventKey, is_read: false, type: new_status === 'cancelled' ? 'alert' : 'info', customer_email: order.customer_email, interval_minutes: 5, sort_order: 0, is_active: true });
    }

    return Response.json({ success: true, order: { id: order.id, order_number: order.order_number, status: new_status } });
  } catch (error) {
    return Response.json({ error: error?.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}
