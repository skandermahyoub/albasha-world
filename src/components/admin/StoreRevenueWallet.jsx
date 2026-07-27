import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Calendar, Filter, TrendingUp, AlertTriangle } from 'lucide-react';
import useCurrency from '@/lib/useCurrency';
import { calculateStoreRevenue, validateTransactionCompleteness, getTransactionDate } from '@/lib/financialMetrics';

import { STORE_SECTIONS, resolveStoreKey } from '@/lib/storeSections';

const STORES = STORE_SECTIONS.map(s => ({ key: s.key, label: s.nameAr, icon: s.emoji, color: s.color }));

const DATE_FILTERS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'all', label: 'الكل' },
];

export default function StoreRevenueWallet() {
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('month');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    const [o, t, p, s] = await Promise.all([
      base44.entities.Order.list('-created_date', 1000).catch(() => []),
      base44.entities.SystemTransaction.list('-created_date', 1000).catch(() => []),
      base44.entities.Product.list('-created_date', 500).catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
    ]);
    setOrders(o);
    setTransactions(t);
    setProducts(p);
    setSettings(s[0] || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const currency = useCurrency(settings);

  const productStoreMap = useMemo(() => {
    const map = {};
    products.forEach(p => { if (p.id) map[p.id] = p.store_key; });
    return map;
  }, [products]);

  const validation = useMemo(() => validateTransactionCompleteness(orders, transactions), [orders, transactions]);

  // Filter financial transactions by date (using transaction date, NOT order.created_date)
  const filteredTxns = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orderByNumber = {};
    orders.forEach(o => { if (o.order_number) orderByNumber[o.order_number] = o; });

    return transactions.filter(t => {
      if (t.type !== 'order_profit' && t.type !== 'order_return') return false;
      const d = new Date(getTransactionDate(t));
      if (dateFilter === 'today' && d < startOfDay) return false;
      if (dateFilter === 'week' && d < startOfWeek) return false;
      if (dateFilter === 'month' && d < startOfMonth) return false;
      if (paymentFilter !== 'all') {
        const order = orderByNumber[t.order_number];
        if (!order || (order.payment_method || '') !== paymentFilter) return false;
      }
      return true;
    });
  }, [transactions, orders, dateFilter, paymentFilter]);

  const storeRevenue = useMemo(() => {
    return calculateStoreRevenue(orders, filteredTxns, productStoreMap);
  }, [orders, filteredTxns, productStoreMap]);

  const totalRevenue = useMemo(() =>
    Object.values(storeRevenue).reduce((s, v) => s + v.revenue, 0),
  [storeRevenue]);

  const totalOrders = useMemo(() =>
    Object.values(storeRevenue).reduce((s, v) => s + v.orders, 0),
  [storeRevenue]);

  const paymentMethods = useMemo(() => {
    const set = new Set(orders.map(o => o.payment_method).filter(Boolean));
    return Array.from(set);
  }, [orders]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> محفظة الإيرادات حسب الفرع</h3>
      </div>

      {!validation.isComplete && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300">البيانات المالية غير مكتملة — يُستخدم fallback على حالة الطلب. قد تكون هناك طلبات لم تُنشأ لها قيود مالية.</span>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><Calendar className="w-3 h-3 ml-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_FILTERS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><Filter className="w-3 h-3 ml-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل طرق الدفع</SelectItem>
            {paymentMethods.map(pm => <SelectItem key={pm} value={pm}>{pm}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="mr-auto text-left">
          <p className="text-[10px] text-muted-foreground">صافي الإيرادات</p>
          <p className="font-bold text-primary text-lg">{currency.format(totalRevenue)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {STORES.map(store => {
          const data = storeRevenue[store.key] || { revenue: 0, orders: 0 };
          const pct = Math.abs(totalRevenue) > 0 ? (Math.abs(data.revenue) / Math.abs(totalRevenue) * 100) : 0;
          return (
            <div key={store.key} className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">{store.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs font-bold">{store.label}</span>
                  <span className="text-xs text-muted-foreground">{data.orders} طلب · {pct.toFixed(0)}%</span>
                </div>
                <div className="h-6 bg-secondary rounded-lg overflow-hidden relative">
                  <div className="h-full rounded-lg transition-all flex items-center justify-end pr-2" style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: store.color }}>
                    <span className="text-[10px] text-white font-bold">{currency.format(data.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/30">
        <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {totalOrders} طلب مسلّم</span>
        <span className="font-bold text-sm">{currency.format(totalRevenue)}</span>
      </div>
    </div>
  );
}