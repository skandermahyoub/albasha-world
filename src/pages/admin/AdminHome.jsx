import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, ShoppingCart, Users, Star, MessageSquare, TrendingUp, DollarSign, BarChart2, Wand2, Gift, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PredictiveStock from '@/components/admin/PredictiveStock';
import HotProducts from '@/components/admin/HotProducts';
import StoreInventoryDashboard from '@/components/admin/StoreInventoryDashboard';
import StockAlertMonitor from '@/components/admin/StockAlertMonitor';
import SalesChartDashboard from '@/components/admin/SalesChartDashboard';
import useCurrency from '@/lib/useCurrency';
import { useAdminPermissions } from '@/lib/useAdminPermissions';
import {
  calculateActiveOrdersValue,
  calculateNetRevenue,
  calculateRefunds,
  calculateOrderCounts,
  countActiveProducts,
} from '@/lib/financialMetrics';

import { STORE_SECTIONS, resolveStoreKey, STORE_COLORS, STORE_NAMES } from '@/lib/storeSections';

const STORE_LABELS = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, `${s.nameAr} ${s.emoji}`])
);

export default function AdminHome() {
  const { canView } = useAdminPermissions();
  const [stats, setStats] = useState({ products: 0, activeProducts: 0, orders: 0, reviews: 0, messages: 0, activeOrdersValue: 0, netRevenue: 0, refunds: 0, customers: 0, giftCards: 0, pendingReviews: 0, orderCounts: {} });
  const [storeStats, setStoreStats] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list().catch(() => []),
      base44.entities.Order.list('-created_date', 500).catch(() => []),
      base44.entities.Review.list().catch(() => []),
      base44.entities.ContactMessage.list().catch(() => []),
      base44.entities.CustomerProfile.filter({ is_archived: false }).catch(() => []),
      base44.entities.GiftCard.list().catch(() => []),
      base44.entities.ProductReview.list().catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
      base44.entities.SystemTransaction.list('-created_date', 500).catch(() => []),
    ]).then(([p, o, r, m, c, gc, pr, s, txns]) => {
      setSettings(s[0] || {});
      setAllProducts(p);
      const activeProducts = countActiveProducts(p);
      const activeOrdersValue = calculateActiveOrdersValue(o);
      const netRevenue = calculateNetRevenue(o, txns);
      const refunds = calculateRefunds(o, txns);
      const orderCounts = calculateOrderCounts(o);
      const activeGiftCards = gc.filter(g => g.status === 'active').length;
      const pendingReviews = pr.filter(rv => rv.status === 'pending').length + r.filter(rv => rv.status === 'pending').length;
      setStats({ products: p.length, activeProducts, orders: o.length, reviews: r.length, messages: m.length, activeOrdersValue, netRevenue, refunds, customers: c.length, giftCards: activeGiftCards, pendingReviews, orderCounts });

      // Store breakdown
      const storeMap = {};
      p.forEach(prod => {
        const key = prod.store_key || 'other';
        if (!storeMap[key]) storeMap[key] = { key, products: 0, revenue: 0, orders: 0 };
        storeMap[key].products++;
      });
      setStoreStats(Object.values(storeMap).map(s => ({
        name: STORE_LABELS[s.key] || s.key,
        منتجات: s.products,
        color: STORE_COLORS[s.key] || '#888',
      })));

      setRecentOrders(o.slice(0, 5));
      setAllOrders(o);
      setAllTransactions(txns);
      setLoading(false);
    });
  }, []);

  const currency = useCurrency(settings);

  const mainCards = [
    { label: 'صافي الإيرادات', value: currency.format(stats.netRevenue), icon: DollarSign, color: 'bg-orange-500', sub: 'مسلّم − مرتجع', to: '/admin/accounting' },
    { label: 'قيمة الطلبات النشطة', value: currency.format(stats.activeOrdersValue), icon: ShoppingCart, color: 'bg-blue-500', sub: 'غير ملغاة وغير مرتجعة', to: '/admin/orders' },
    { label: 'المرتجعات', value: currency.format(stats.refunds), icon: RotateCcw, color: 'bg-red-500', sub: 'قيمة المرتجعات', to: '/admin/orders' },
    { label: 'الطلبات', value: stats.orders, icon: ShoppingCart, color: 'bg-cyan-500', sub: `معلقة: ${stats.orderCounts.pending || 0} · مسلّمة: ${stats.orderCounts.delivered || 0}`, to: '/admin/orders' },
    { label: 'المنتجات النشطة', value: stats.activeProducts, icon: Package, color: 'bg-purple-500', sub: `من إجمالي ${stats.products}`, to: '/admin/products' },
    { label: 'العملاء', value: stats.customers, icon: Users, color: 'bg-orange-500', sub: 'مسجلين في CRM', to: '/admin/crm' },
    { label: 'الآراء', value: stats.reviews, icon: Star, color: 'bg-yellow-500', sub: 'تقييمات العملاء', to: '/admin/reviews' },
    { label: 'رسائل جديدة', value: stats.messages, icon: MessageSquare, color: 'bg-red-500', sub: 'رسائل التواصل', to: '/admin/messages' },
    { label: 'بطاقات هدايا', value: stats.giftCards, icon: Gift, color: 'bg-pink-500', sub: 'بطاقات نشطة', to: '/admin/gift-cards' },
    { label: 'تقييمات معلقة', value: stats.pendingReviews, icon: Star, color: 'bg-amber-500', sub: 'بانتظار الموافقة', to: '/admin/reviews' },
  ].filter(card => !card.to || canView(card.to.includes('orders') ? 'orders' : card.to.includes('products') ? 'products' : card.to.includes('crm') || card.to.includes('reviews') || card.to.includes('messages') ? 'customers' : card.to.includes('accounting') ? 'accounting' : card.to.includes('gift-cards') ? 'coupons' : 'settings'));

  const quickLinks = [
    { to: '/admin/products', label: 'إضافة منتج', icon: Package, color: 'bg-purple-500/10 text-purple-600' },
    { to: '/admin/orders', label: 'الطلبات', icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-600' },
    { to: '/admin/crm', label: 'CRM', icon: Users, color: 'bg-orange-500/10 text-orange-600' },
    { to: '/admin/ai-tools', label: 'أدوات AI', icon: Wand2, color: 'bg-pink-500/10 text-pink-600' },
    { to: '/admin/store-configs', label: 'النشاطات', icon: BarChart2, color: 'bg-orange-500/10 text-orange-600' },
    { to: '/admin/banners', label: 'البانرات', icon: TrendingUp, color: 'bg-yellow-500/10 text-yellow-600' },
    { to: '/admin/gift-cards', label: 'بطاقات الهدايا', icon: Gift, color: 'bg-pink-500/10 text-pink-600' },
  ];

  const ORDER_STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700',
    returned: 'bg-pink-100 text-pink-700',
  };
  const ORDER_STATUS_LABELS = {
    pending: 'معلق', confirmed: 'مؤكد', preparing: 'قيد التحضير',
    shipped: 'مشحون', delivered: 'مسلّم', cancelled: 'ملغي', returned: 'مرتجع',
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <StockAlertMonitor />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">لوحة القيادة</h1>
          <p className="text-sm text-muted-foreground">مرحباً في نظام إدارة {settings?.store_name || 'متجري'}</p>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {mainCards.map((card, i) => {
          const content = (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-card rounded-xl p-4 border border-border/50 ${card.to ? 'cursor-pointer hover:border-primary/50 hover:shadow-md transition-all' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white`}>
                  <card.icon className="w-5 h-5" />
                </div>
                {card.to && <span className="text-[10px] text-primary/60 font-medium">انقر للتفاصيل ←</span>}
              </div>
              <p className="text-2xl font-heading font-bold">{card.value}</p>
              <p className="text-sm font-medium">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </motion.div>
          );
          return card.to ? <Link key={i} to={card.to}>{content}</Link> : <div key={i}>{content}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Breakdown Chart */}
        {storeStats.length > 0 && (
          <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border/50">
            <h3 className="font-heading font-bold mb-4">توزيع المنتجات حسب النشاط</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={storeStats} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="منتجات" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <h3 className="font-heading font-bold mb-4">وصول سريع</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((l, i) => (
              <Link
                key={i}
                to={l.to}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${l.color} hover:opacity-80 transition-opacity`}
              >
                <l.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Store Inventory & Sales Dashboard */}
      <div className="bg-card rounded-xl p-5 border border-border/50">
        <h3 className="font-heading font-bold mb-4">حالة المخزون والمبيعات حسب النشاط</h3>
        <StoreInventoryDashboard products={allProducts} orders={allOrders} transactions={allTransactions} settings={settings} />
      </div>

      {/* Sales Comparison Charts */}
      <SalesChartDashboard />

      {/* Predictive Analytics & Hot Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PredictiveStock />
        <HotProducts />
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold">آخر الطلبات</h3>
            <Link to="/admin/orders" className="text-sm text-primary hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">#{order.order_number || order.id.slice(-6)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{currency.format(order.total)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status] || 'bg-secondary text-secondary-foreground'}`}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}