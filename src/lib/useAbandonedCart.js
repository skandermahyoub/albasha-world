import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const DELAY_MS = 60000; // 1 minute of inactivity before tracking

/**
 * Hook لتتبع السلات المتروكة تلقائياً
 * يستخدم وظيفة خلفية آمنة بدل من تعديل كيان AbandonedCart مباشرة
 * @param {Array} items - عناصر السلة
 * @param {number} total - إجمالي السلة
 */
export function useAbandonedCart(items, total) {
  const timerRef = useRef(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!items || items.length === 0) {
      trackedRef.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (trackedRef.current) return;

      try {
        const me = await base44.auth.me().catch(() => null);
        const email = me?.email;

        await base44.functions.invoke('track-abandoned-cart', {
          items: items.map(i => ({
            product_id: i.product_id,
            title: i.title,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          cart_total: total,
          customer_email: email || '',
          customer_name: me?.full_name || '',
        });
        trackedRef.current = true;
      } catch (e) {
        // silent fail
      }
    }, DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, total]);
}