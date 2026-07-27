import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import StoreHealthCards from '@/components/admin/StoreHealthCards';
import AIManagerChat from '@/components/admin/AIManagerChat';
import { useStoreSettings } from '@/lib/useStoreSettings';
import useCurrency from '@/lib/useCurrency';
import {
  calculateNetRevenue,
  calculateTotalExpenses,
  calculateEstimatedProfit,
} from '@/lib/financialMetrics';

export default function AdminSmartManager() {
  const { settings } = useStoreSettings();
  const currency = useCurrency(settings);
  const storeName = settings?.store_name || 'متجري';
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

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
  const estimatedProfit = useMemo(() => calculateEstimatedProfit(netRevenue, totalExpenses), [netRevenue, totalExpenses]);
  const lowStock = useMemo(() => products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5), [products]);
  const deadStock = useMemo(() => products.filter(p => (p.stock ?? 0) > 0 && !(p.sales_count > 0)), [products]);
  const topSellers = useMemo(() => [...products].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 5), [products]);

  const contextSummary = useMemo(() => {
    return `- صافي الإيرادات: ${currency.format(netRevenue)}
- إجمالي النفقات التشغيلية: ${currency.format(totalExpenses)}
- الربح التقديري: ${currency.format(estimatedProfit)}
- عدد الطلبات الكلي: ${orders.length}
- عدد المنتجات على وشك النفاد (مخزون 5 أو أقل): ${lowStock.length} — أمثلة: ${lowStock.slice(0, 5).map(p => p.title).join('، ') || 'لا يوجد'}
- عدد المنتجات الراكدة (بدون أي مبيعات): ${deadStock.length} — أمثلة: ${deadStock.slice(0, 5).map(p => p.title).join('، ') || 'لا يوجد'}
- أفضل 5 منتجات مبيعاً: ${topSellers.map(p => `${p.title} (${p.sales_count || 0} مبيعة)`).join('، ') || 'لا يوجد'}
- نفقات حسب التصنيف: ${expenses.length ? Object.entries(expenses.reduce((m, e) => { m[e.category] = (m[e.category] || 0) + e.amount; return m; }, {})).map(([k, v]) => `${k}: ${currency.format(v)}`).join('، ') : 'لا يوجد'}`;
  }, [netRevenue, totalExpenses, estimatedProfit, orders, lowStock, deadStock, topSellers, expenses, currency]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت مستشار أعمال يدير متجراً تجارياً صغيراً اسمه "${storeName}". هذه بيانات المتجر الفعلية:\n\n${contextSummary}\n\nبناءً على هذه البيانات فقط، قدّم تحليلاً موجزاً وعملياً بلغة عربية بسيطة يشمل: ملخص الحالة العامة للمتجر، توقع مالي قصير المدى (هل الوضع في تحسن أم تراجع بناءً على الأرقام)، وأهم 3 توصيات عملية لتحسين التجارة.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          forecast: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    setAnalysis(result);
    setAnalyzing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl">المدير الذكي</h1>
        <Button onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
          تحليل حالة المتجر الآن
        </Button>
      </div>

      <StoreHealthCards
        revenueLabel={currency.format(netRevenue)}
        expensesLabel={currency.format(totalExpenses)}
        profitLabel={currency.format(estimatedProfit)}
        lowStockCount={lowStock.length}
        deadStockCount={deadStock.length}
      />

      {analysis && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
          <div>
            <h3 className="font-heading font-bold text-sm mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> ملخص الحالة</h3>
            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{analysis.summary || ''}</ReactMarkdown>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> التوقع المالي</h3>
            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{analysis.forecast || ''}</ReactMarkdown>
          </div>
          {analysis.recommendations?.length > 0 && (
            <div>
              <h3 className="font-heading font-bold text-sm mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> التوصيات</h3>
              <ul className="space-y-1.5">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm bg-secondary rounded-lg px-3 py-2">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <AIManagerChat contextSummary={contextSummary} />
    </div>
  );
}