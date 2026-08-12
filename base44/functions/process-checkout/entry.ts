import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      customer_name, customer_phone, customer_email, address, notes,
      items, shipping_zone_id, payment_method,
      coupon_code, gift_card_code, use_wallet, use_loyalty,
      affiliate_code, idempotency_key
    } = body;

    // ── 1. Validate inputs ──
    if (!idempotency_key) {
      return Response.json({ error: 'مفتاح منع التكرار مفقود' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'السلة فارغة' }, { status: 400 });
    }

    // ── 2. Idempotency check ──
    const existingOrders = await base44.asServiceRole.entities.Order.filter(
      { idempotency_key }, '-created_date', 1
    );
    if (existingOrders.length > 0) {
      const existing = existingOrders[0];
      return Response.json({
        success: true,
        order: {
          id: existing.id,
          order_number: existing.order_number,
          total: existing.total,
          subtotal: existing.subtotal,
          discount: existing.discount,
          shipping_fee: existing.shipping_fee,
        },
        idempotent: true,
        message: 'تم استرداد الطلب السابق',
      });
    }

    // ── 3. Get user (may be null for guest) ──
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    const userEmail = user?.email || customer_email || '';
    let profileRecord = null;
    if (user?.email) {
      const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email });
      profileRecord = profiles[0] || null;
    }
    const effectiveCustomerName = customer_name || profileRecord?.full_name || profileRecord?.name || user?.full_name || '';
    const effectiveCustomerPhone = customer_phone || profileRecord?.phone || '';
    const effectiveAddress = address || profileRecord?.address || '';
    if (!effectiveCustomerName || !effectiveCustomerPhone) {
      return Response.json({ error: 'الاسم الكامل ورقم الهاتف مطلوبان لإتمام الطلب' }, { status: 400 });
    }

    // ── 4. Read products from DB (do NOT trust frontend prices) ──
    const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
    const products = await Promise.all(
      productIds.map(id =>
        base44.asServiceRole.entities.Product.get(id).catch(() => null)
      )
    );
    const productMap = {};
    products.forEach(p => { if (p) productMap[p.id] = p; });

    // ── 5. Validate products ──
    for (const item of items) {
      const product = productMap[item.product_id];
      if (!product) {
        return Response.json({ error: `المنتج غير موجود` }, { status: 400 });
      }
      if (product.status === 'archived' || product.status === 'draft') {
        return Response.json({ error: `المنتج غير متاح: ${product.title}` }, { status: 400 });
      }
      if (typeof product.stock === 'number' && product.stock < item.quantity) {
        return Response.json({ error: `الكمية المطلوبة غير متوفرة: ${product.title} (متوفر: ${product.stock})` }, { status: 400 });
      }
    }

    // ── 6. Read settings ──
    const settingsList = await base44.asServiceRole.entities.StoreSettings.list();
    const settings = settingsList[0] || {};
    const currency = settings?.currency || 'USD';
    const rates = settings?.exchange_rates || { USD: 1, SAR: 3.75, YER_OLD: 530, YER_NEW: 1630, AED: 3.67 };

    // ── 7. Calculate subtotal (server-side) ──
    const subtotal = items.reduce((sum, item) => {
      const product = productMap[item.product_id];
      return sum + (Number(product.price) || 0) * item.quantity;
    }, 0);

    // ── 8. Read shipping zone ──
    let shippingFee = 0;
    let shippingZoneName = '';
    if (shipping_zone_id) {
      const zones = await base44.asServiceRole.entities.ShippingZone.filter({ id: shipping_zone_id });
      const zone = zones[0];
      if (zone && zone.is_active !== false) {
        shippingZoneName = zone.zone_name;
        const fee = Number(zone.delivery_fee) || 0;
        const zoneCurrency = zone.currency || 'YER_NEW';
        shippingFee = fee / (rates[zoneCurrency] || 1);
      }
    }

    // ── 9. Validate discount code (coupon or gift card) ──
    let discount = 0;
    let couponRecord = null;
    let giftCardRecord = null;
    let giftCardAmount = 0;
    const discountCode = coupon_code || gift_card_code || '';
    if (discountCode) {
      // Try coupon first
      const coupons = await base44.asServiceRole.entities.Coupon.filter({
        code: discountCode.toUpperCase(), is_active: true
      });
      couponRecord = coupons[0];
      if (couponRecord) {
        const now = new Date();
        if (couponRecord.valid_from && new Date(couponRecord.valid_from) > now) {
          return Response.json({ error: 'هذا الكود لم يبدأ بعد' }, { status: 400 });
        }
        if (couponRecord.valid_until && new Date(couponRecord.valid_until) < now) {
          return Response.json({ error: 'انتهت صلاحية الكود' }, { status: 400 });
        }
        if (couponRecord.max_uses > 0 && (couponRecord.used_count || 0) >= couponRecord.max_uses) {
          return Response.json({ error: 'تم استخدام الكود بالكامل' }, { status: 400 });
        }
        if (couponRecord.min_order_value > 0 && subtotal < couponRecord.min_order_value) {
          return Response.json({ error: `الحد الأدنى للطلب هو ${couponRecord.min_order_value}$` }, { status: 400 });
        }
        // Check for existing usage with same idempotency_key (prevent double counting)
        const existingUsage = await base44.asServiceRole.entities.CouponUsage.filter({
          coupon_id: couponRecord.id, idempotency_key
        });
        if (existingUsage.length > 0) {
          return Response.json({ error: 'تم استخدام هذا الكوبون مسبقاً لنفس الطلب' }, { status: 400 });
        }
        discount = couponRecord.discount_type === 'percentage'
          ? subtotal * (couponRecord.discount_value || 0) / 100
          : Math.min(couponRecord.discount_value || 0, subtotal);
      } else {
        // Not a coupon — try gift card
        const cards = await base44.asServiceRole.entities.GiftCard.filter({
          code: discountCode.toUpperCase(), status: 'active'
        });
        giftCardRecord = cards[0];
        if (!giftCardRecord) {
          return Response.json({ error: 'كود غير صحيح أو غير مفعّل' }, { status: 400 });
        }
        if (giftCardRecord.expires_at && new Date(giftCardRecord.expires_at) < new Date()) {
          return Response.json({ error: 'انتهت صلاحية بطاقة الهدايا' }, { status: 400 });
        }
        const remaining = (giftCardRecord.amount || 0) - (giftCardRecord.used_amount || 0);
        if (remaining <= 0) {
          return Response.json({ error: 'رصيد البطاقة مستنفد' }, { status: 400 });
        }
        // Check for existing usage with same idempotency_key
        const existingGcTxn = await base44.asServiceRole.entities.GiftCardTransaction.filter({
          gift_card_id: giftCardRecord.id, idempotency_key
        });
        if (existingGcTxn.length > 0) {
          return Response.json({ error: 'تم استخدام هذه البطاقة مسبقاً لنفس الطلب' }, { status: 400 });
        }
        giftCardAmount = Math.min(remaining, subtotal - discount);
        discount += giftCardAmount;
      }
    }

    // ── 11. Loyalty points ──
    let loyaltyDiscount = 0;
    let loyaltyRecord = null;
    if (use_loyalty && userEmail) {
      const lps = await base44.asServiceRole.entities.LoyaltyPoints.filter({ user_email: userEmail });
      loyaltyRecord = lps[0];
      if (loyaltyRecord && (loyaltyRecord.points || 0) > 0) {
        loyaltyDiscount = Math.min((loyaltyRecord.points || 0) / 100, Math.max(0, subtotal - discount));
        discount += loyaltyDiscount;
      }
    }

    // ── 12. Free shipping ──
    const freeShippingEnabled = settings?.free_shipping_enabled === true;
    const freeShippingThreshold = Number(settings?.free_shipping_threshold) || 0;
    if (freeShippingEnabled && freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
      shippingFee = 0;
    }

    // ── 13. Wallet payment ──
    let walletUsed = 0;
    if (use_wallet && userEmail) {
      if (profileRecord && (profileRecord.wallet_balance || 0) > 0) {
        const finalBeforeWallet = subtotal - discount + shippingFee;
        walletUsed = Math.min(profileRecord.wallet_balance, finalBeforeWallet);
      }
    }

    // ── 14. Final total ──
    const finalTotal = Math.max(0, subtotal - discount + shippingFee - walletUsed);

    // ── 15. Generate order number ──
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // ── 16. Build order items ──
    const orderItems = items.map(item => {
      const product = productMap[item.product_id];
      return {
        product_id: item.product_id,
        title: product.title,
        price: Number(product.price) || 0,
        quantity: item.quantity,
        image: product.image || '',
      };
    });

    // ── 17. Create order ──
    const orderData = {
      order_number: orderNumber,
      customer_name: effectiveCustomerName,
      customer_phone: effectiveCustomerPhone,
      customer_email: userEmail,
      items: orderItems,
      subtotal,
      discount,
      total: finalTotal,
      currency,
      status: 'pending',
      status_history: [{ status: 'pending', date: new Date().toISOString() }],
      payment_method: payment_method || '',
      address: effectiveAddress,
      notes: notes || '',
      shipping_zone: shippingZoneName,
      shipping_fee: shippingFee,
      source: 'online',
      idempotency_key,
      stock_deducted: false,
      sales_updated: false,
      commission_calculated: false,
    };

    let order;
    order = await base44.asServiceRole.entities.Order.create(orderData);

    if (user?.email) {
      const profileData = { full_name: effectiveCustomerName, name: effectiveCustomerName, phone: effectiveCustomerPhone, address: effectiveAddress };
      if (profileRecord) {
        await base44.asServiceRole.entities.CustomerProfile.update(profileRecord.id, profileData);
      } else {
        profileRecord = await base44.asServiceRole.entities.CustomerProfile.create({ user_email: user.email, ...profileData });
      }
    }

    if (userEmail) {
      await base44.asServiceRole.entities.Notification.create({
        title: 'تم استلام طلبك',
        message: `تم استلام الطلب ${orderNumber} وهو الآن قيد المراجعة.`,
        icon: '📦',
        target_type: 'order',
        target_id: order.id,
        target_route: `/orders/${orderNumber}`,
        event_key: `order:${order.id}:pending`,
        is_read: false,
        type: 'info',
        customer_email: userEmail,
        interval_minutes: 5,
        sort_order: 0,
        is_active: true,
      });
    }

    const staffAccounts = await base44.asServiceRole.entities.SystemAdmin.filter({ is_active: true });
    const staffRecipients = staffAccounts.filter(account => ['view', 'edit', 'delete', 'full'].includes(account.permissions?.orders)).map(account => account.email).filter(Boolean);
    if (staffRecipients.length) {
      await base44.asServiceRole.entities.Notification.bulkCreate(staffRecipients.map(email => ({
        title: `طلب جديد ${orderNumber}`, message: `تم استلام طلب جديد بقيمة ${finalTotal} ${currency}.`, icon: '📦', type: 'info', customer_email: email,
        target_type: 'order', target_id: order.id, target_route: `/admin/orders?order=${order.id}`, event_key: `staff-order:${order.id}:${email}`, is_read: false, is_active: true, interval_minutes: 5, sort_order: 0,
      })));
    }

    // ── 18. Deduct wallet
    if (walletUsed > 0 && profileRecord) {
      const newBalance = (profileRecord.wallet_balance || 0) - walletUsed;
      await base44.asServiceRole.entities.CustomerProfile.update(profileRecord.id, {
        wallet_balance: newBalance
      });
      await base44.asServiceRole.entities.WalletTransaction.create({
        customer_email: userEmail,
        type: 'purchase',
        amount: walletUsed,
        balance_after: newBalance,
        description: `طلب #${orderNumber}`,
        order_id: orderNumber,
        status: 'completed',
      });
    }

    // ── 19. Record coupon usage (CouponUsage + increment used_count) ──
    if (couponRecord) {
      await base44.asServiceRole.entities.CouponUsage.create({
        coupon_id: couponRecord.id,
        coupon_code: couponRecord.code,
        order_id: order.id,
        order_number: orderNumber,
        customer_email: userEmail,
        discount_amount: discount - giftCardAmount - loyaltyDiscount,
        status: 'active',
        idempotency_key,
      });
      await base44.asServiceRole.entities.Coupon.update(couponRecord.id, {
        used_count: (couponRecord.used_count || 0) + 1
      });
    }

    // ── 20. Record gift card transaction ──
    if (giftCardRecord) {
      const balanceBefore = (giftCardRecord.amount || 0) - (giftCardRecord.used_amount || 0);
      const newUsedAmount = (giftCardRecord.used_amount || 0) + giftCardAmount;
      const balanceAfter = (giftCardRecord.amount || 0) - newUsedAmount;
      const newStatus = newUsedAmount >= (giftCardRecord.amount || 0) ? 'used' : 'active';

      await base44.asServiceRole.entities.GiftCardTransaction.create({
        gift_card_id: giftCardRecord.id,
        gift_card_code: giftCardRecord.code,
        order_id: order.id,
        order_number: orderNumber,
        amount: giftCardAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        type: 'purchase',
        idempotency_key,
      });
      await base44.asServiceRole.entities.GiftCard.update(giftCardRecord.id, {
        used_amount: newUsedAmount,
        status: newStatus
      });
    }

    // ── 21. Update loyalty points ──
    if (userEmail) {
      let pointsBalance = loyaltyRecord?.points || 0;
      let totalEarned = loyaltyRecord?.total_earned || 0;
      let totalSpent = loyaltyRecord?.total_spent || 0;
      const history = loyaltyRecord?.history ? [...loyaltyRecord.history] : [];

      if (loyaltyDiscount > 0) {
        const pointsToDeduct = Math.floor(loyaltyDiscount * 100);
        pointsBalance = Math.max(0, pointsBalance - pointsToDeduct);
        totalSpent += pointsToDeduct;
        history.push({
          action: 'spend', points: -pointsToDeduct,
          date: new Date().toISOString(), description: `خصم على طلب #${orderNumber}`
        });
      }

      const earnedPoints = Math.floor(finalTotal);
      if (earnedPoints > 0) {
        pointsBalance += earnedPoints;
        totalEarned += earnedPoints;
        history.push({
          action: 'earn', points: earnedPoints,
          date: new Date().toISOString(), description: `طلب #${orderNumber}`
        });
      }

      if (loyaltyRecord) {
        await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyRecord.id, {
          points: pointsBalance, total_earned: totalEarned,
          total_spent: totalSpent, history
        });
      } else if (earnedPoints > 0 || loyaltyDiscount > 0) {
        await base44.asServiceRole.entities.LoyaltyPoints.create({
          user_email: userEmail,
          points: pointsBalance, total_earned: totalEarned,
          total_spent: totalSpent, history
        });
      }

      if (earnedPoints > 0) {
        await base44.asServiceRole.entities.Order.update(order.id, {
          loyalty_points_earned: earnedPoints
        });
      }

      if (profileRecord) {
        await base44.asServiceRole.entities.CustomerProfile.update(profileRecord.id, {
          total_spent: (profileRecord.total_spent || 0) + finalTotal,
          orders_count: (profileRecord.orders_count || 0) + 1,
        });
      }
    }

    // ── 22. Create PENDING affiliate commission (not earned yet — only on delivery) ──
    if (affiliate_code) {
      const affs = await base44.asServiceRole.entities.Affiliate.filter({ affiliate_code });
      const aff = affs[0];
      if (aff && aff.status === 'active') {
        const commissionAmount = (subtotal * (aff.commission_rate || 5)) / 100;
        await base44.asServiceRole.entities.AffiliateCommission.create({
          affiliate_id: aff.id,
          affiliate_code: aff.affiliate_code,
          order_id: order.id,
          order_number: orderNumber,
          sale_amount: subtotal,
          commission_rate: aff.commission_rate || 5,
          commission_amount: commissionAmount,
          status: 'pending',
        });
        // Update total_sales immediately (clicks + sales tracking), commission on delivery
        await base44.asServiceRole.entities.Affiliate.update(aff.id, {
          total_sales: (aff.total_sales || 0) + subtotal,
        });
      }
    }

    // ── 23. Mark abandoned cart as recovered ──
    if (userEmail) {
      const abandonedCarts = await base44.asServiceRole.entities.AbandonedCart.filter({
        customer_email: userEmail, status: 'pending'
      });
      if (abandonedCarts.length > 0) {
        for (const ac of abandonedCarts) {
          await base44.asServiceRole.entities.AbandonedCart.update(ac.id, {
            status: 'recovered',
            recovered_order_id: orderNumber,
          });
        }
      }
    }

    // ── 24. Return success ──
    return Response.json({
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        total: finalTotal,
        subtotal,
        discount,
        shipping_fee: shippingFee,
        wallet_used: walletUsed,
        loyalty_discount: loyaltyDiscount,
        items: orderItems,
        currency,
      },
      whatsapp_number: settings?.whatsapp_number || '',
    });

  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}