import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import StoreHealthCards from '@/components/admin/StoreHealthCards';
import AIManagerChat from '@/components/admin/AIManagerChat';
import { useStoreSettings } from '@/lib/useStoreSettings';
import useCurrency from '@/lib/useCurrency';
import {
  calculateNetRevenue,
  calculateTotalExpenses,
  calculateCOGS,
  calculateGrossProfit,
  calculateNetProfit,
  isCostDataComplete,
} from '@/lib/financialMetrics';

export default function AdminSmartManager() {
  const { settings } = useStoreSettings();
  const currency = useCurrency(settings);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [o, t, e, p] = await Promise.all([
        base44.entities.Order.list('-created_date', 1000).catch(() => []),
        base44.entities.SystemTransaction.list('-created_date', 1000).catch(() => []),
        base44.entities.Expense.list('-date', 500).catch(() => []),
        base44.entities.Product.list('-sales_count', 1000).catch(() => []),
      ]);
      setOrders(o);
      setTransactions(t);
      setExpenses(e);
      setProducts(p);
      setLoading(false);
    })();
  }, []);

  const netRevenue = useMemo(() => calculateNetRevenue(orders, transactions), [orders, transactions]);
  const totalExpenses = useMemo(() => calculateTotalExpenses(expenses), [expenses]);
  const cogs = useMemo(() => calculateCOGS(orders, transactions), [orders, transactions]);
  const grossProfit = useMemo(() => calculateGrossProfit(netRevenue, cogs), [netRevenue, cogs]);
  const netProfit = useMemo(() => calculateNetProfit(netRevenue, cogs, totalExpenses), [netRevenue, cogs, totalExpenses]);
  const costDataComplete = useMemo(() => isCostDataComplete(orders), [orders]);
  const lowStock = useMemo(() => products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5), [products]);
  const deadStock = useMemo(() => products.filter(p => (p.stock ?? 0) > 0 && !(p.sales_count > 0)), [products]);
  const topSellers = useMemo(() => [...products].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5), [products]);

  const contextSummary = useMemo(() => {
    return `- صافي الإيرادات: ${currency.format(netRevenue)}
- تكلفة البضاعة المباعة COGS: ${currency.format(cogs)}
- إجمالي الربح: ${currency.format(grossProfit)}
- إجمالي النفقات التشغيلية: ${currency.format(totalExpenses)}
- صافي الربح: ${currency.format(netProfit)}
- اكتمال بيانات تكلفة الطلبات التاريخية: ${costDataComplete ? 'مكتمل' : 'غير مكتمل لبعض الطلبات القديمة'}
- عدد الطلبات الكلي: ${orders.length}
- عدد المنتجات على وشك النفاد (مخزون 5 أو أقل): ${lowStock.length} — أمثلة: ${lowStock.slice(0, 5).map(p => p.title).join('، ') || 'لا يوجد'}
- عدد المنتجات الراكدة (بدون أي مبيعات): ${deadStock.length} — أمثلة: ${deadStock.slice(0, 5).map(p => p.title).join('، ') || 'لا يوجد'}
- أفضل 5 منتجات مبيعاً: ${topSellers.map(p => `${p.title} (${p.sales_count || 0} مبيعة)`).join('، ') || 'لا يوجد'}
- نفقات حسب التصنيف: ${expenses.length ? Object.entries(expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([k, v]) => `${k}: ${currency.format(v)}`).join('، ') : 'لا يوجد'}`;
  }, [netRevenue, cogs, grossProfit, totalExpenses, netProfit, costDataComplete, orders, lowStock, deadStock, topSellers, expenses, currency]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl">المدير الذكي</h1>
      </div>

      <StoreHealthCards
        revenueLabel={currency.format(netRevenue)}
        expensesLabel={currency.format(totalExpenses)}
        profitLabel={currency.format(netProfit)}
        lowStockCount={lowStock.length}
        deadStockCount={deadStock.length}
      />

      <AIManagerChat contextSummary={contextSummary} />
    </div>
  );
}