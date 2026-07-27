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
        const [orders, products] = await Promise.all([
          base44.entities.Order.list('-created_date', 5).catch(() => []),
          base44.entities.Product.list('-created_date', 200).catch(() => []),
        ]);

        const available = orders.filter(
          o => o.status === 'delivered' || o.status === 'confirmed' || o.status === 'preparing'
        );
        if (available.length > 0) {
          setRecentOrder(available[0]);
        }
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
              طلب جديد: <b className="text-foreground">{recentOrder.order_number}</b>
            </motion.span>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}