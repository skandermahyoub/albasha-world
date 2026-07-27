import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Star, RotateCcw } from 'lucide-react';
import useCurrency from '@/lib/useCurrency';
import { Link } from 'react-router-dom';
import {
  calculateNetRevenue,
  calculateActiveOrdersValue,
  calculateRefunds,
  calculateOrderCounts,
  countActiveProducts,
  getOrderDeliveryDate,
  validateTransactionCompleteness,
} from '@/lib/financialMetrics';

const COLORS = ['#7C3AED', '#a855f7', '#c084fc', '#e9d5ff', '#6d28d9'];

export default function AdminERP() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list('-created_date', 500).catch(() => []),
      base44.entities.Product.list('-sales_count', 100).catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
      base44.entities.SystemTransaction.list('-created_date', 500).catch(() => []),
    ]).then(([o, p, s, t]) => { setOrders(o); setProducts(p); setSettings(s[0] || {}); setTransactions(t); setLoading(false); });
  }, []);

  const currency = useCurrency(settings);
  const netRevenue = useMemo(() => calculateNetRevenue(orders, transactions), [orders, transactions]);
  const activeOrdersValue = useMemo(() => calculateActiveOrdersValue(orders), [orders]);
  const orderCounts = useMemo(() => calculateOrderCounts(orders), [orders]);
  const activeProducts = useMemo(() => countActiveProducts(products), [products]);
  const lowStock = products.filter(p => p.stock !== undefined && p.stock <= (p.stock_alert_threshold ?? 5));
  const outOfStock = products.filter(p => p.stock === 0);

  // Monthly revenue from transactions (preferred) or order delivery date
  const revenueChart = useMemo(() => {
    const monthlyData = {};
    const txnValidation = validateTransactionCompleteness(orders, transactions);
    if (txnValidation.isComplete) {
      transactions.filter(t => t.type === 'order_profit' || t.type === 'order_return').forEach(t => {
        const d = new Date(t.date || t.created_date);
        const key = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
        monthlyData[key] = (monthlyData[key] || 0) + (t.amount || 0);
      });
    } else {
      orders.filter(o => o.status === 'delivered' || o.status === 'returned').forEach(o => {
        const d = new Date(getOrderDeliveryDate(o) || o.created_date);
        const key = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
        monthlyData[key] = (monthlyData[key] || 0) + (o.total || 0);
      });
    }
    return Object.entries(monthlyData).slice(-6).map(([month, revenue]) => ({ month, revenue: currency.convert(revenue) }));
  }, [orders, transactions, currency]);

  // Top products by sales
  const topProducts = [...products].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5);

  // Status distribution
  const statusDist = [
    { name: 'معلق', value: orderCounts.pending },
    { name: 'جارٍ', value: orderCounts.confirmed + orderCounts.preparing + orderCounts.shipped },
    { name: 'مُسلَّم', value: orderCounts.delivered },
    { name: 'ملغي', value: orderCounts.cancelled },
    { name: 'مرتجع', value: orderCounts.returned },
  ].filter(s => s.value > 0);

  const cards = [
    { label: 'صافي الإيرادات', value: currency.format(netRevenue), icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'قيمة الطلبات النشطة', value: currency.format(activeOrdersValue), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'إجمالي الطلبات', value: orders.length, icon: ShoppingCart, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
    { label: 'طلبات معلقة', value: orderCounts.pending, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'المنتجات النشطة', value: activeProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'نفاد المخزون', value: outOfStock.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
    { label: 'طلبات مُسلَّمة', value: orderCounts.delivered, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'مرتجعات', value: orderCounts.returned, icon: RotateCcw, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950' },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">نظام ERP — إدارة النشاطات</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`${c.bg} rounded-xl p-4 border border-border/30`}>
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className={`font-heading font-bold text-xl ${c.color}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueChart.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <h2 className="font-heading font-bold mb-4">صافي الإيرادات الشهرية ({currency.CURRENCY_LABELS[currency.currency] || currency.currency})</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueChart}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [currency.format(v / (settings?.exchange_rates?.[currency.currency] || 1)), 'الإيراد']} />
              <Bar dataKey="revenue" fill="hsl(263 70% 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Status Pie */}
        {statusDist.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <h2 className="font-heading font-bold mb-4">توزيع حالات الطلبات</h2>
            <div className="flex items-center gap-4">
              <PieChart width={120} height={120}>
                <Pie data={statusDist} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value">
                  {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-1.5">
                {statusDist.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{s.name}:</span>
                    <span className="font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Products */}
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <h2 className="font-heading font-bold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> أعلى المنتجات مبيعاً</h2>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{p.title}</span>
                <span className="text-xs text-muted-foreground">{p.sales_count || 0} مبيعة</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <h2 className="font-heading font-bold mb-3 flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-4 h-4" /> تنبيه المخزون المنخفض ({lowStock.length})
          </h2>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{p.title}</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${p.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'}`}>
                  {p.stock === 0 ? 'نفد' : `${p.stock} قطعة`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <h2 className="font-heading font-bold mb-4">آخر الطلبات</h2>
        <div className="space-y-2">
          {orders.slice(0, 8).map(o => (
            <Link key={o.id} to="/admin/orders" className="flex items-center justify-between text-sm border-b border-border/30 pb-2 hover:bg-accent/30 rounded-lg px-1 transition-colors">
              <div className="min-w-0">
                <p className="font-medium truncate">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">{o.order_number}</p>
              </div>
              <div className="text-left shrink-0 mr-2">
                <p className="font-bold text-primary">{currency.format(o.total)}</p>
                <p className="text-xs text-muted-foreground">{o.status}</p>
              </div>
            </Link>
          ))}
          {orders.length === 0 && <p className="text-center text-muted-foreground py-4">لا توجد طلبات بعد</p>}
        </div>
      </div>
    </div>
  );
}