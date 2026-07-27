import { Package, AlertTriangle, TrendingUp, Boxes, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStores } from '@/lib/navLinks';
import { STORE_SECTIONS, resolveStoreKey } from '@/lib/storeSections';
import { calculateStoreRevenue } from '@/lib/financialMetrics';
import useCurrency from '@/lib/useCurrency';

const STORE_EMOJI = Object.fromEntries(STORE_SECTIONS.map(s => [s.key, s.emoji]));

export default function StoreInventoryDashboard({ products = [], orders = [], transactions = [], settings }) {
  const currency = useCurrency(settings);
  const dynamicStores = getStores(settings?.theme_config);
  const STORE_META = Object.fromEntries(dynamicStores.map(s => [s.key, { name: s.name, color: s.color, icon: STORE_EMOJI[s.key] || '📦' }]));

  const productStoreMap = {};
  products.forEach(p => { if (p.id) productStoreMap[p.id] = p.store_key; });

  const storeRevenueMap = calculateStoreRevenue(orders, transactions, productStoreMap);

  const stores = Object.entries(STORE_META).map(([key, meta]) => {
    const storeProducts = products.filter(p => resolveStoreKey(p.store_key) === key);
    const lowStock = storeProducts.filter(p => (p.stock ?? 0) <= (p.stock_alert_threshold ?? 5) && p.status !== 'archived');
    const outOfStock = storeProducts.filter(p => (p.stock ?? 0) === 0 && p.status !== 'archived');
    const totalStock = storeProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const productIds = new Set(storeProducts.map(p => p.id));
    const storeOrders = orders.filter(o => (o.status === 'delivered' || o.status === 'returned') && (o.items || []).some(i => productIds.has(i.product_id)));
    const revenue = storeRevenueMap[key]?.revenue || 0;
    const ordersCount = storeRevenueMap[key]?.orders || storeOrders.length;
    return { key, ...meta, productCount: storeProducts.length, totalStock, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length, ordersCount, revenue, lowStockItems: lowStock };
  });

  const allLowStock = products
    .filter(p => (p.stock ?? 0) <= (p.stock_alert_threshold ?? 5) && p.status !== 'archived')
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))
    .slice(0, 12);

  const totalRevenue = Object.values(storeRevenueMap).reduce((s, v) => s + (v.revenue || 0), 0);

  return (
    <div className="space-y-4">
      {/* Per-store cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stores.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-3 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="font-heading font-bold text-sm">{s.name}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" /> المنتجات</span>
                <span className="font-bold">{s.productCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><Boxes className="w-3 h-3" /> المخزون</span>
                <span className="font-bold">{s.totalStock}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> المبيعات</span>
                <span className="font-bold">{s.ordersCount} طلب</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> الإيرادات</span>
                <span className="font-bold" style={{ color: s.color }}>{currency.format(s.revenue)}</span>
              </div>
            </div>
            {(s.lowStockCount > 0 || s.outOfStockCount > 0) && (
              <div className="mt-2 pt-2 border-t border-border/30">
                {s.outOfStockCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                    <AlertTriangle className="w-3 h-3" /> {s.outOfStockCount} نفد مخزونها
                  </div>
                )}
                {s.lowStockCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                    <AlertTriangle className="w-3 h-3" /> {s.lowStockCount} منخفض المخزون
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-end pt-1">
        <span className="text-xs text-muted-foreground">إجمالي الإيرادات:</span>
        <span className="font-bold text-sm mr-2">{currency.format(totalRevenue)}</span>
      </div>

      {/* Low stock alerts */}
      {allLowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-heading font-bold text-amber-900 dark:text-amber-200">تنبيهات المخزون المنخفض</h3>
            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full font-bold">{allLowStock.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allLowStock.map(p => {
              const meta = STORE_META[resolveStoreKey(p.store_key)] || { color: '#888', icon: '📦', name: p.store_key };
              const isOut = (p.stock || 0) === 0;
              return (
                <Link
                  key={p.id}
                  to="/admin/products"
                  className="flex items-center gap-2 p-2 bg-white dark:bg-card rounded-lg border border-amber-100 dark:border-amber-900/30 hover:shadow-sm transition-all"
                >
                  {p.image && <img src={p.image} alt="" className="w-9 h-9 rounded object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.icon} {meta.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${isOut ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                    {p.stock || 0}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}