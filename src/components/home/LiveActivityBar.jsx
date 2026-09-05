import { useState, useEffect } from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

/**
 * Shows real store activity — recent orders and product count.
 * Does NOT show fake viewer counts or simulated purchases.
 * If no real data is available, shows a subtle, honest message.
 */
export default function LiveActivityBar() {
  const [recentOrder, setRecentOrder] = useState(null);
  const [activeProducts, setActiveProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [activity, products] = await Promise.all([
          base44.functions.invoke('get-public-activity', {}).then(res => res.data || {}).catch(() => ({})),
          base44.functions.invoke('get-public-products', { sort: '-created_date', limit: 200 }).then(res => res.data?.products || []).catch(() => []),
        ]);

        setRecentOrder(activity?.has_recent_order ? { status: activity.recent_status } : null);
        setActiveProducts(products.filter(p => p.status === 'active' || !p.status).length);
      } catch {
        // silent fail
      }
      setLoading(false);
    };
    load();
    // Refresh every 60 seconds
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return null;

  return (
    <div className="mx-4 mt-4 flex flex-wrap items-center gap-3 bg-secondary/50 rounded-xl px-4 py-2 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <ShoppingBag className="w-3.5 h-3.5 text-primary" />
        <b className="text-foreground">{activeProducts}</b> منتج متاح الآن
      </span>
      {recentOrder && (
        <>
          <span className="w-px h-4 bg-border hidden sm:block" />
          <AnimatePresence mode="wait">
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-1.5 text-muted-foreground"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              تم تسجيل طلب جديد مؤخراً
            </motion.span>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}