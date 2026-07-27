import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, ShoppingCart, Calendar, RotateCcw, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import useCurrency from '@/lib/useCurrency';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TYPE_LABELS = { order_profit: 'ربح طلب', deposit: 'إيداع', withdrawal: 'سحب', order_return: 'مرتجع طلب' };
const TYPE_COLORS = { order_profit: 'text-green-600', deposit: 'text-blue-600', withdrawal: 'text-red-600', order_return: 'text-pink-600' };
const TYPE_BG = { order_profit: 'bg-green-100', deposit: 'bg-blue-100', withdrawal: 'bg-red-100', order_return: 'bg-pink-100' };

export default function AdminSystemAccounts() {
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [form, setForm] = useState({ amount: '', performed_by: '', reason: '' });
  const [filterType, setFilterType] = useState('all');

  const load = async () => {
    const [t, o, s] = await Promise.all([
      base44.entities.SystemTransaction.list('-created_date', 500).catch(() => []),
      base44.entities.Order.filter({ status: 'delivered' }, '-created_date', 1000).catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
    ]);
    setTransactions(t);
    setOrders(o);
    setSettings(s[0] || {});
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const currency = useCurrency(settings);

  // Compute balance — order_return amounts are negative, so addition gives net
  const balance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'withdrawal') return sum - (t.amount || 0);
      return sum + (t.amount || 0);
    }, 0);
  }, [transactions]);

  // Stats
  const totalOrderProfit = useMemo(() => transactions.filter(t => t.type === 'order_profit').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const totalReturns = useMemo(() => transactions.filter(t => t.type === 'order_return').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const totalDeposits = useMemo(() => transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const totalWithdrawals = useMemo(() => transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + (t.amount || 0), 0), [transactions]);

  // Daily profits for chart (last 7 days) — includes order_return (negative)
  const dailyData = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { day: d.toLocaleDateString('ar', { weekday: 'short', day: 'numeric' }), profit: 0 };
    }
    transactions.filter(t => t.type === 'order_profit' || t.type === 'order_return').forEach(t => {
      const key = (t.date || t.created_date || '').slice(0, 10);
      if (map[key]) map[key].profit += t.amount || 0;
    });
    return Object.values(map);
  }, [transactions]);

  // Monthly profits — includes order_return
  const monthlyData = useMemo(() => {
    const map = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { month: d.toLocaleDateString('ar', { month: 'short', year: 'numeric' }), profit: 0 };
    }
    transactions.filter(t => t.type === 'order_profit' || t.type === 'order_return').forEach(t => {
      const key = (t.date || t.created_date || '').slice(0, 7);
      if (map[key]) map[key].profit += t.amount || 0;
    });
    return Object.values(map);
  }, [transactions]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayProfit = transactions.filter(t => (t.type === 'order_profit' || t.type === 'order_return') && (t.date || t.created_date || '').slice(0, 10) === todayStr).reduce((s, t) => s + (t.amount || 0), 0);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthProfit = transactions.filter(t => (t.type === 'order_profit' || t.type === 'order_return') && (t.date || t.created_date || '').slice(0, 7) === currentMonthKey).reduce((s, t) => s + (t.amount || 0), 0);
  const currentYear = new Date().getFullYear().toString();
  const yearProfit = transactions.filter(t => (t.type === 'order_profit' || t.type === 'order_return') && (t.date || t.created_date || '').startsWith(currentYear)).reduce((s, t) => s + (t.amount || 0), 0);

  const handleDeposit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('أدخل مبلغاً صحيحاً');
    await base44.entities.SystemTransaction.create({
      type: 'deposit',
      amount: parseFloat(form.amount),
      performed_by: form.performed_by || 'الإدارة',
      reason: form.reason,
      date: new Date().toISOString(),
    });
    toast.success('تم الإيداع');
    setOpenDeposit(false); setForm({ amount: '', performed_by: '', reason: '' }); load();
  };

  const handleWithdraw = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('أدخل مبلغاً صحيحاً');
    if (parseFloat(form.amount) > balance) return toast.error('الرصيد غير كافٍ');
    await base44.entities.SystemTransaction.create({
      type: 'withdrawal',
      amount: parseFloat(form.amount),
      performed_by: form.performed_by || 'الإدارة',
      reason: form.reason,
      date: new Date().toISOString(),
    });
    toast.success('تم السحب');
    setOpenWithdraw(false); setForm({ amount: '', performed_by: '', reason: '' }); load();
  };

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  // Build a map for quick lookup of original transactions (for reference_transaction_id)
  const txnMap = useMemo(() => {
    const map = {};
    transactions.forEach(t => { map[t.id] = t; });
    return map;
  }, [transactions]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> حسابات النظام
          </h1>
          <p className="text-sm text-muted-foreground mt-1">متابعة الأرباح والتسويات المالية</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setForm({ amount: '', performed_by: '', reason: '' }); setOpenDeposit(true); }} variant="outline" className="border-blue-300 text-blue-600">
            <ArrowDownCircle className="w-4 h-4 ml-1" /> إيداع
          </Button>
         <Button onClick={() => { setForm({ amount: '', performed_by: '', reason: '' }); setOpenWithdraw(true); }} variant="outline" className="border-red-300 text-red-600">
            <ArrowUpCircle className="w-4 h-4 ml-1" /> سحب
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/20 text-center">
        <p className="text-sm text-muted-foreground mb-1">الرصيد الحالي للنظام</p>
        <p className="font-heading font-bold text-4xl text-primary">{currency.format(balance)}</p>
        <p className="text-xs text-muted-foreground mt-2">{transactions.length} عملية مسجلة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">ربح اليوم</p>
          <p className="font-bold text-green-600">{currency.format(todayProfit)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">ربح الشهر</p>
          <p className="font-bold text-blue-600">{currency.format(monthProfit)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">ربح السنة</p>
          <p className="font-bold text-primary">{currency.format(yearProfit)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <ShoppingCart className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">إجمالي الطلبات المسلَّمة</p>
          <p className="font-bold text-orange-600">{orders.length}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-card border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي أرباح الطلبات</p>
          <p className="font-bold text-xl text-green-600">{currency.format(totalOrderProfit)}</p>
        </div>
        <div className="bg-card border border-pink-200 dark:border-pink-800 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي المرتجعات</p>
          <p className="font-bold text-xl text-pink-600">{currency.format(totalReturns)}</p>
        </div>
        <div className="bg-card border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي الإيداعات</p>
          <p className="font-bold text-xl text-blue-600">{currency.format(totalDeposits)}</p>
        </div>
        <div className="bg-card border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي السحوبات</p>
          <p className="font-bold text-xl text-red-600">{currency.format(totalWithdrawals)}</p>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading font-bold mb-4">صافي الإيرادات اليومية (آخر 7 أيام)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData}>
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [currency.format(v), 'الصافي']} />
            <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading font-bold mb-4">صافي الإيرادات الشهرية (آخر 6 أشهر)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [currency.format(v), 'الصافي']} />
            <Bar dataKey="profit" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Log */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading font-bold">سجل العمليات ({filtered.length})</h3>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm">
            <option value="all">كل العمليات</option>
            <option value="order_profit">أرباح الطلبات</option>
            <option value="order_return">مرتجعات</option>
            <option value="deposit">الإيداعات</option>
            <option value="withdrawal">السحوبات</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد عمليات</p>
        ) : (
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filtered.map(t => (
              <div key={t.id} className="p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_BG[t.type]}`}>
                  {t.type === 'order_profit' && <ShoppingCart className={`w-4 h-4 ${TYPE_COLORS[t.type]}`} />}
                  {t.type === 'order_return' && <RotateCcw className={`w-4 h-4 ${TYPE_COLORS[t.type]}`} />}
                  {t.type === 'deposit' && <ArrowDownCircle className={`w-4 h-4 ${TYPE_COLORS[t.type]}`} />}
                  {t.type === 'withdrawal' && <ArrowUpCircle className={`w-4 h-4 ${TYPE_COLORS[t.type]}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-bold">{TYPE_LABELS[t.type]}</span>
                    <span className={`font-bold ${t.type === 'withdrawal' ? 'text-red-600' : t.type === 'order_return' ? 'text-pink-600' : 'text-green-600'}`}>
                      {t.type === 'withdrawal' ? '-' : ''}{currency.format(t.amount)}
                    </span>
                  </div>
                  {t.order_number && (
                    <p className="text-xs text-muted-foreground">
                      طلب: {t.order_number}
                      {t.order_subtotal > 0 && <> · قبل الخصم: {currency.format(t.order_subtotal)}</>}
                      {t.order_discount > 0 && <> · خصم: {currency.format(t.order_discount)}</>}
                    </p>
                  )}
                  {t.reference_transaction_id && txnMap[t.reference_transaction_id] && (
                    <p className="text-xs text-pink-600 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      قيد عكسي مرتبط بقيد: {txnMap[t.reference_transaction_id].reason || txnMap[t.reference_transaction_id].order_number || t.reference_transaction_id.slice(-6)}
                    </p>
                  )}
                  {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                  {t.performed_by && <p className="text-xs text-muted-foreground">بواسطة: {t.performed_by}</p>}
                  {t.reason && <p className="text-xs text-muted-foreground">السبب: {t.reason}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(t.date || t.created_date).toLocaleString('ar')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Dialog */}
      <Dialog open={openDeposit} onOpenChange={setOpenDeposit}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownCircle className="w-5 h-5 text-blue-600" /> إيداع مبلغ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="المبلغ *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Input placeholder="اسم الحساب المنفذ" value={form.performed_by} onChange={e => setForm(f => ({ ...f, performed_by: e.target.value }))} />
            <Textarea placeholder="سبب الإيداع (اختياري)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} />
            <Button onClick={handleDeposit} className="w-full">تأكيد الإيداع</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={openWithdraw} onOpenChange={setOpenWithdraw}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpCircle className="w-5 h-5 text-red-600" /> سحب مبلغ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-secondary/30 rounded-lg p-3 text-center text-sm">
              الرصيد المتاح: <span className="font-bold text-primary">{currency.format(balance)}</span>
            </div>
            <Input type="number" placeholder="المبلغ *" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Input placeholder="اسم الحساب المنفذ *" value={form.performed_by} onChange={e => setForm(f => ({ ...f, performed_by: e.target.value }))} />
            <Textarea placeholder="سبب السحب (اختياري)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} />
            <Button onClick={handleWithdraw} className="w-full bg-red-600 hover:bg-red-700 text-white">تأكيد السحب</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}