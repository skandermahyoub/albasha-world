import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, new_status, performed_by } = body;

    // ── 1. Admin only ──
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });
    }

    if (!order_id || !new_status) {
      return Response.json({ error: 'معرف الطلب والحالة الجديدة مطلوبان' }, { status: 400 });
    }

    // ── 2. Read order ──
    let order;
    try {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
      order = orders[0];
    } catch {
      return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }
    if (!order) {
      return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // ── 3. Validate transition ──
    const ALLOWED_TRANSITIONS = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'shipped', 'delivered', 'cancelled'],
      preparing: ['shipped', 'delivered', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['returned'],
      cancelled: [],
      returned: [],
    };
    const prevStatus = order.status;
    const allowed = ALLOWED_TRANSITIONS[prevStatus] || [];
    if (!allowed.includes(new_status)) {
      return Response.json(
        { error: `لا يمكن الانتقال من "${prevStatus}" إلى "${new_status}"` },
        { status: 400 }
      );
    }

    // Idempotency: return already processed — return success without re-processing
    if (new_status === 'returned' && order.return_processed) {
      return Response.json({
        success: true,
        order: { id: order.id, order_number: order.order_number, status: 'returned' },
        message: 'تم معالجة المرتجع مسبقاً',
      });
    }

    const history = order.status_history ? [...order.status_history] : [];
    history.push({ status: new_status, date: new Date().toISOString() });

    const updateData = {
      status: new_status,
      status_history: history,
    };
    if (new_status === 'confirmed' && !order.assigned_employee && performed_by) {
      updateData.assigned_employee = performed_by;
    }

    // ── 3. Inventory: deduct on "confirmed" ──
    if (new_status === 'confirmed' && !order.stock_deducted) {
      for (const item of (order.items || [])) {
        if (!item.product_id) continue;
        const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
        const product = products[0];
        if (!product) continue;
        const stockBefore = Number(product.stock) || 0;
        const stockAfter = Math.max(0, stockBefore - item.quantity);
        await base44.asServiceRole.entities.Product.update(product.id, { stock: stockAfter });
        await base44.asServiceRole.entities.InventoryMovement.create({
          product_id: item.product_id,
          product_title: item.title || product.title,
          sku: product.sku || '',
          type: 'sale',
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          unit_price: item.price,
          total: (item.price || 0) * item.quantity,
          order_id: order.id,
          order_number: order.order_number,
          note: `تأكيد طلب`,
        });
      }
      updateData.stock_deducted = true;
    }

    // ── 4. Inventory: restore on "cancelled" ──
    if (new_status === 'cancelled' && order.stock_deducted) {
      for (const item of (order.items || [])) {
        if (!item.product_id) continue;
        const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
        const product = products[0];
        if (!product) continue;
        const stockBefore = Number(product.stock) || 0;
        const stockAfter = stockBefore + item.quantity;
        await base44.asServiceRole.entities.Product.update(product.id, { stock: stockAfter });
        await base44.asServiceRole.entities.InventoryMovement.create({
          product_id: item.product_id,
          product_title: item.title || product.title,
          sku: product.sku || '',
          type: 'adjustment',
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          unit_price: item.price,
          total: (item.price || 0) * item.quantity,
          order_id: order.id,
          order_number: order.order_number,
          note: `إلغاء طلب - إعادة المخزون`,
        });
      }
      updateData.stock_deducted = false;
    }

    // ── 5. Sales + financial + affiliate commission: on "delivered" ──
    if (new_status === 'delivered' && !order.sales_updated) {
      for (const item of (order.items || [])) {
        if (!item.product_id) continue;
        const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
        const product = products[0];
        if (!product) continue;
        await base44.asServiceRole.entities.Product.update(product.id, {
          sales_count: (Number(product.sales_count) || 0) + item.quantity
        });
      }
      // Create financial record
      await base44.asServiceRole.entities.SystemTransaction.create({
        type: 'order_profit',
        amount: order.total || 0,
        order_number: order.order_number,
        order_subtotal: order.subtotal || 0,
        order_discount: order.discount || 0,
        performed_by: performed_by || user.full_name || 'admin',
        reason: `تسليم طلب ${order.order_number}`,
        date: new Date().toISOString(),
      });

      // ── Affiliate commission: mark as earned ──
      const pendingCommissions = await base44.asServiceRole.entities.AffiliateCommission.filter({
        order_id: order.id, status: 'pending'
      });
      for (const comm of pendingCommissions) {
        await base44.asServiceRole.entities.AffiliateCommission.update(comm.id, {
          status: 'earned',
        });
        // Update affiliate totals
        const affs = await base44.asServiceRole.entities.Affiliate.filter({ id: comm.affiliate_id });
        const aff = affs[0];
        if (aff) {
          await base44.asServiceRole.entities.Affiliate.update(aff.id, {
            total_commission: (aff.total_commission || 0) + comm.commission_amount,
          });
        }
      }

      updateData.sales_updated = true;
      updateData.commission_calculated = true;
    }

    // ── 6. Inventory + sales + financial + affiliate: reverse on "returned" ──
    if (new_status === 'returned') {
      const originalTxns = await base44.asServiceRole.entities.SystemTransaction.filter({
        order_number: order.order_number,
        type: 'order_profit',
      });
      const originalTxn = originalTxns[0];

      for (const item of (order.items || [])) {
        if (!item.product_id) continue;
        const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
        const product = products[0];
        if (!product) continue;
        const stockBefore = Number(product.stock) || 0;
        const stockAfter = stockBefore + item.quantity;
        const salesBefore = Number(product.sales_count) || 0;
        const salesAfter = Math.max(0, salesBefore - item.quantity);
        await base44.asServiceRole.entities.Product.update(product.id, {
          stock: stockAfter,
          sales_count: salesAfter
        });
        await base44.asServiceRole.entities.InventoryMovement.create({
          product_id: item.product_id,
          product_title: item.title || product.title,
          sku: product.sku || '',
          type: 'return',
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          unit_price: item.price,
          total: (item.price || 0) * item.quantity,
          order_id: order.id,
          order_number: order.order_number,
          note: `مرتجع`,
        });
      }
      // Create reverse financial transaction
      await base44.asServiceRole.entities.SystemTransaction.create({
        type: 'order_return',
        amount: -(order.total || 0),
        order_number: order.order_number,
        order_subtotal: order.subtotal || 0,
        order_discount: order.discount || 0,
        performed_by: performed_by || user.full_name || 'admin',
        reason: `استرجاع طلب ${order.order_number}`,
        date: new Date().toISOString(),
        notes: originalTxn ? 'قيد عكسي مرتبط بقيد التسليم' : 'قيد عكسي - لم يُعثر على قيد التسليم الأصلي',
        reference_transaction_id: originalTxn ? originalTxn.id : null,
      });

      // ── Reverse affiliate commission ──
      const earnedCommissions = await base44.asServiceRole.entities.AffiliateCommission.filter({
        order_id: order.id, status: 'earned'
      });
      for (const comm of earnedCommissions) {
        // Mark original as reversed
        await base44.asServiceRole.entities.AffiliateCommission.update(comm.id, {
          status: 'reversed',
        });
        // Create reversal record
        await base44.asServiceRole.entities.AffiliateCommission.create({
          affiliate_id: comm.affiliate_id,
          affiliate_code: comm.affiliate_code,
          order_id: order.id,
          order_number: order.order_number,
          sale_amount: -(comm.sale_amount || 0),
          commission_rate: comm.commission_rate || 0,
          commission_amount: -(comm.commission_amount || 0),
          status: 'reversed',
          reference_commission_id: comm.id,
        });
        // Update affiliate totals (subtract)
        const affs = await base44.asServiceRole.entities.Affiliate.filter({ id: comm.affiliate_id });
        const aff = affs[0];
        if (aff) {
          await base44.asServiceRole.entities.Affiliate.update(aff.id, {
            total_commission: Math.max(0, (aff.total_commission || 0) - (comm.commission_amount || 0)),
          });
        }
      }

      updateData.stock_deducted = false;
      updateData.return_processed = true;
    }

    // ── 7. Update order ──
    await base44.asServiceRole.entities.Order.update(order.id, updateData);

    return Response.json({
      success: true,
      order: { id: order.id, order_number: order.order_number, status: new_status },
    });

  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}