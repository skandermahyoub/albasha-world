import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, Loader2, Trophy, AlertTriangle } from 'lucide-react';
import { getStores } from '@/lib/navLinks';
import { STORE_KEYS, STORE_SECTIONS, resolveStoreKey } from '@/lib/storeSections';
import useCurrency from '@/lib/useCurrency';
import { validateTransactionCompleteness, getTransactionDate } from '@/lib/financialMetrics';

const STORE_EMOJI = Object.fromEntries(STORE_SECTIONS.map(s => [s.key, s.emoji]));

function buildStoreMeta(themeConfig) {
  const stores = getStores(themeConfig);
  const meta = {};
  stores.forEach(s => { meta[s.key] = { name: s.name, color: s.color, icon: STORE_EMOJI[s.key] || '📦' }; });
  return meta;
}

export default function SalesChartDashboard() {
  const [view, setView] = useState('daily');
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleStores, setVisibleStores] = useState(new Set(STORE_KEYS));
  const [dataComplete, setDataComplete] = useState(true);

  const storeMeta = buildStoreMeta(settings?.theme_config);
  const currency = useCurrency(settings);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Product.list('-created_date', 500).catch(() => []),
      base44.entities.Order.list('-created_date', 1000).catch(() => []),
      base44.entities.SystemTransaction.list('-created_date', 1000).catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
    ]).then(([products, orders, transactions, s]) => {
      setSettings(s[0] || {});
      const meta = buildStoreMeta(s[0]?.theme_config);
      const productStoreMap = {};
      products.forEach(p => { if (p.id) productStoreMap[p.id] = resolveStoreKey(p.store_key); });

      const validation = validateTransactionCompleteness(orders, transactions);
      setDataComplete(validation.isComplete);

      // Build order map by order_number
      const orderByNumber = {};
      orders.forEach(o => { if (o.order_number) orderByNumber[o.order_number] = o; });

      // Financial transactions only (order_profit positive, order_return negative)
      const financialTxns = transactions.filter(t => t.type === 'order_profit' || t.type === 'order_return');

      const now = new Date();
      let labels = [];
      let groupFn;

      if (view === 'daily') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          labels.push(d);
        }
        groupFn = (txnDate, labelDate) => new Date(txnDate).toDateString() === labelDate.toDateString();
      } else {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(d);
        }
        groupFn = (txnDate, labelDate) => {
          const td = new Date(txnDate);
          return td.getMonth() === labelDate.getMonth() && td.getFullYear() === labelDate.getFullYear();
        };
      }

      const chartData = labels.map(labelDate => {
        const point = {
          name: view === 'daily'
            ? labelDate.toLocaleDateString('ar', { day: 'numeric', month: 'short' })
            : labelDate.toLocaleDateString('ar', { month: 'long' }),
        };
        STORE_KEYS.forEach(key => { point[key] = 0; });

        financialTxns.forEach(t => {
          const tDate = getTransactionDate(t);
          if (!tDate || !groupFn(tDate, labelDate)) return;
          const order = orderByNumber[t.order_number];
          if (!order || !order.items) return;

          // Distribute transaction amount across stores by item value proportion
          const storeValues = {};
          let totalItemsValue = 0;
          order.items.forEach(item => {
            const sk = productStoreMap[item.product_id];
            if (!sk || !meta[sk]) return;
            const itemValue = (item.price || 0) * (item.quantity || 1);
            storeValues[sk] = (storeValues[sk] || 0) + itemValue;
            totalItemsValue += itemValue;
          });
          if (totalItemsValue === 0) return;

          Object.entries(storeValues).forEach(([sk, value]) => {
            const proportion = value / totalItemsValue;
            point[sk] += (t.amount || 0) * proportion;
          });
        });
        return point;
      });

      const totals = {};
      STORE_KEYS.forEach(key => {
        totals[key] = chartData.reduce((sum, point) => sum + point[key], 0);
      });

      setData({ chartData, totals });
      setLoading(false);
    });
  }, [view]);

  const toggleStore = (key) => {
    setVisibleStores(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const bestStore = data ? Object.entries(data.totals).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0] : null;
  const grandTotal = data ? Object.values(data.totals).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="bg-card rounded-xl p-5 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          مقارنة إيرادات الفروع
        </h3>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${view === 'daily' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            <Calendar className="w-3 h-3" /> يومي
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${view === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            <Calendar className="w-3 h-3" /> شهري
          </button>
        </div>
      </div>

      {!dataComplete && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300">البيانات المالية غير مكتملة — قد تكون هناك طلبات لم تُنشأ لها قيود مالية.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {Object.entries(storeMeta).map(([key, meta]) => {
              const total = data.totals[key] || 0;
              const isBest = bestStore && bestStore[0] === key && Math.abs(total) > 0;
              return (
                <div key={key} className={`rounded-lg p-2.5 border ${isBest ? 'border-primary/50 bg-primary/5' : 'border-border/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{meta.icon}</span>
                    {isBest && <Trophy className="w-3 h-3 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{meta.name}</p>
                  <p className="text-sm font-bold" style={{ color: meta.color }}>{currency.format(total)}</p>
                </div>
              );
            })}
          </div>

          {/* Store toggles */}
          <div className="flex gap-1 flex-wrap mb-3">
            {Object.entries(storeMeta).map(([key, meta]) => (
              <button key={key} onClick={() => toggleStore(key)} className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${visibleStores.has(key) ? 'text-white' : 'bg-secondary text-muted-foreground opacity-50'}`} style={visibleStores.has(key) ? { backgroundColor: meta.color } : {}}>
                {meta.icon} {meta.name}
              </button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.chartData} barSize={view === 'daily' ? 12 : 30}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v, name) => [currency.format(v), storeMeta[name]?.name || name]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend formatter={(v) => storeMeta[v]?.name || v} wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(storeMeta).filter(([key]) => visibleStores.has(key)).map(([key, meta]) => (
                <Bar key={key} dataKey={key} fill={meta.color} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              {view === 'daily' ? 'آخر 7 أيام' : 'آخر 6 أشهر'}
            </span>
            <span className="text-sm font-bold">صافي الإيرادات: {currency.format(grandTotal)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}