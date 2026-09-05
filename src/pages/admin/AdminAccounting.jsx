import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar, RotateCcw, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import useCurrency from '@/lib/useCurrency';
import StoreRevenueWallet from '@/components/admin/StoreRevenueWallet';
import {
  calculateGrossSales,
  calculateRefunds,
  calculateNetRevenue,
  calculateTotalExpenses,
  calculateCOGS,
  calculateGrossProfit,
  calculateNetProfit,
  calculateOrderCOGS,
  isCostDataComplete,
  getOrderDeliveryDate,
  validateTransactionCompleteness,
} from '@/lib/financialMetrics';

const CATEGORY_LABELS = {
  rent: 'إيجار', salaries: 'رواتب', utilities: 'خدمات (كهرباء/ماء/إنترنت)',
  marketing: 'تسويق وإعلانات', shipping: 'شحن وتوصيل', purchases: 'مشتريات بضاعة', other: 'أخرى',
};

const MONTHS_BACK = 6;

export default function AdminAccounting() {
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', date: new Date().toISOString().slice(0, 10), notes: '' });

  const load = async () => {
    const [o, t, e, s] = await Promise.all([
      base44.entities.Order.list('-created_date', 1000).catch(() => []),
      base44.entities.SystemTransaction.list('-created_date', 1000).catch(() => []),
      base44.entities.Expense.list('-date', 500).catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
    ]);
    setOrders(o);
    setTransactions(t);
    setExpenses(e);
    setSettings(s[0] || {});
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const currency = useCurrency(settings);

  // Centralized financial metrics
  const grossSales = useMemo(() => calculateGrossSales(orders, transactions), [orders, transactions]);
  const refunds = useMemo(() => calculateRefunds(orders, transactions), [orders, transactions]);
  const netRevenue = useMemo(() => calculateNetRevenue(orders, transactions), [orders, transactions]);
  const totalExpenses = useMemo(() => calculateTotalExpenses(expenses), [expenses]);
  const cogs = useMemo(() => calculateCOGS(orders, transactions), [orders, transactions]);
  const grossProfit = useMemo(() => calculateGrossProfit(netRevenue, cogs), [netRevenue, cogs]);
  const netProfit = useMemo(() => calculateNetProfit(netRevenue, cogs, totalExpenses), [netRevenue, cogs, totalExpenses]);
  const costDataComplete = useMemo(() => isCostDataComplete(orders), [orders]);

  const monthlyData = useMemo(() => {
    const map = {};
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { key, label: d.toLocaleDateString('ar', { month: 'short', year: 'numeric' }), revenue: 0, cogs: 0, expenses: 0 };
    }
    // Revenue from transactions (preferred) or order delivery date
    const txnValidation = validateTransactionCompleteness(orders, transactions);
    if (txnValidation.isComplete) {
      const orderByNumber = Object.fromEntries(orders.filter(o => o.order_number).map(o => [o.order_number, o]));
      transactions.filter(t => t.type === 'order_profit' || t.type === 'order_return').forEach(t => {
        const d = new Date(t.date || t.created_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (map[key]) {
          map[key].revenue += t.amount || 0;
          const orderCost = calculateOrderCOGS(orderByNumber[t.order_number]);
          map[key].cogs += t.type === 'order_return' ? -orderCost : orderCost;
        }
      });
    } else {
      orders.filter(o => o.status === 'delivered').forEach(o => {
        const d = new Date(getOrderDeliveryDate(o) || o.created_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (map[key]) {
          map[key].revenue += o.total || 0;
          map[key].cogs += calculateOrderCOGS(o);
        }
      });
    }
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map[key]) map[key].expenses += e.amount || 0;
    });
    return Object.values(map);
  }, [orders, transactions, expenses]);

  const expensesByCategory = useMemo(() => {
    const map = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + (e.amount || 0); });
    return map;
  }, [expenses]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount || !form.date) return toast.error('أدخل الاسم والمبلغ والتاريخ');
    await base44.entities.Expense.create({ ...form, amount: parseFloat(form.amount) });
    toast.success('تمت إضافة المصروف');
    setOpen(false);
    setForm({ title: '', amount: '', category: 'other', date: new Date().toISOString().slice(0, 10), notes: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا المصروف؟')) return;
    await base44.entities.Expense.delete(id);
    toast.success('تم الحذف');
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">النظام المحاسبي</h1>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 ml-2" /> إضافة مصروف</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1"><DollarSign className="w-4 h-4" /> <span className="text-xs font-medium">إجمالي المبيعات</span></div>
          <p className="text-2xl font-bold">{currency.format(grossSales)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">طلبات مسلّمة قبل المرتجعات</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-pink-600 mb-1"><RotateCcw className="w-4 h-4" /> <span className="text-xs font-medium">المرتجعات</span></div>
          <p className="text-2xl font-bold">{currency.format(refunds)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">قيمة المرتجعات</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1"><TrendingUp className="w-4 h-4" /> <span className="text-xs font-medium">صافي الإيرادات</span></div>
          <p className="text-2xl font-bold">{currency.format(netRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">مبيعات − مرتجعات</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1"><TrendingDown className="w-4 h-4" /> <span className="text-xs font-medium">تكلفة البضاعة COGS</span></div>
          <p className="text-2xl font-bold">{currency.format(cogs)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">تكلفة تاريخية للسلع المباعة</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1"><TrendingDown className="w-4 h-4" /> <span className="text-xs font-medium">النفقات التشغيلية</span></div>
          <p className="text-2xl font-bold">{currency.format(totalExpenses)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">إجمالي المصروفات</p>
        </div>
      </div>

      {/* Profit */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">إجمالي الربح</p>
              <p className="text-[10px] text-muted-foreground">صافي الإيرادات − تكلفة البضاعة</p>
            </div>
            <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{currency.format(grossProfit)}</p>
          </div>
          <div className="flex items-center justify-between gap-3 md:border-r md:border-border md:pr-4">
            <div className="flex items-center gap-2 text-primary">
              <Wallet className="w-5 h-5" />
              <div>
                <p className="text-sm font-bold">صافي الربح</p>
                <p className="text-[10px] text-muted-foreground">إجمالي الربح − النفقات التشغيلية</p>
              </div>
            </div>
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{currency.format(netProfit)}</p>
          </div>
        </div>
        {!costDataComplete && <p className="mt-3 text-xs text-amber-600">تنبيه: بعض الطلبات القديمة سبقت حفظ تكلفة البضاعة التاريخية؛ مؤشرات الربح تصبح كاملة تلقائياً للطلبات الجديدة.</p>}
      </div>

      {/* Sales Wallet */}
      <StoreRevenueWallet />

      {/* Monthly Breakdown */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> آخر {MONTHS_BACK} أشهر</h3>
        <div className="space-y-2">
          {monthlyData.map(m => (
            <div key={m.key} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground">{m.label}</span>
              <div className="flex gap-4 flex-wrap justify-end">
                <span className="text-orange-600">إيراد {currency.format(m.revenue)}</span>
                <span className="text-amber-600">COGS {currency.format(m.cogs)}</span>
                <span className="text-red-600">مصروف {currency.format(m.expenses)}</span>
                <span className={`font-bold ${m.revenue - m.cogs - m.expenses >= 0 ? 'text-primary' : 'text-red-600'}`}>صافي {currency.format(m.revenue - m.cogs - m.expenses)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses by Category */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="font-heading font-bold mb-3">النفقات حسب التصنيف</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(expensesByCategory).map(([cat, amount]) => (
              <div key={cat} className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</p>
                <p className="font-bold text-sm mt-1">{currency.format(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border font-bold text-sm">سجل النفقات ({expenses.length})</div>
        {expenses.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">لا توجد نفقات مسجلة بعد</p>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[e.category] || e.category} · {e.date}</p>
                </div>
                <span className="font-bold text-red-600 text-sm shrink-0">{currency.format(e.amount)}</span>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive shrink-0" onClick={() => handleDelete(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إضافة مصروف جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم المصروف" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input type="number" placeholder="المبلغ" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}