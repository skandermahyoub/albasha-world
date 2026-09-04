import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { motion } from 'framer-motion';
import { Undo2, Package, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Returns() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ order_id: '', product_id: '', reason: 'defective', type: 'return', description: '' });

  useEffect(() => {
    const load = async () => {
      const [s, me] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setSettings(s[0] || {});
      setUser(me);
      if (me) {
        const [o, r] = await Promise.all([
          base44.functions.invoke('get-my-orders', {}).then(res => res.data?.orders || []).catch(() => []),
          base44.functions.invoke('get-my-returns', {}).then(res => res.data?.returns || []).catch(() => []),
        ]);
        setOrders(o.filter(order => order.status === 'delivered'));
        setReturns(r);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.order_id || !form.product_id || !form.reason) {
      toast.error('اختر الطلب والمنتج وسبب الإرجاع');
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('submit-return-request', form);
      if (!res.data?.success) {
        toast.error(res.data?.error || 'فشل إرسال الطلب');
        setSubmitting(false);
        return;
      }
      toast.success(`تم إرسال طلب الإرجاع #${res.data.request?.request_number || ''}`);
      setShowForm(false);
      setForm({ order_id: '', product_id: '', reason: 'defective', type: 'return', description: '' });
      const r = await base44.functions.invoke('get-my-returns', {}).then(response => response.data?.returns || []).catch(() => []);
      setReturns(r);
    } catch (err) {
      toast.error('فشل إرسال الطلب');
    }
    setSubmitting(false);
  };

  const reasonLabels = {
    defective: 'منتج معيب', wrong_item: 'منتج خاطئ', not_as_described: 'غير مطابق للوصف',
    changed_mind: 'تغيير الرأي', damaged_shipping: 'تضرر أثناء الشحن', other: 'أخرى',
  };

  const statusLabels = {
    pending: 'قيد المراجعة', approved: 'موافق عليه', rejected: 'مرفوض',
    pickup_scheduled: 'مجدول للاستلام', received: 'تم الاستلام',
    refunded: 'تم الاسترداد', completed: 'مكتمل',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700', pickup_scheduled: 'bg-purple-100 text-purple-700',
    received: 'bg-indigo-100 text-indigo-700', refunded: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <Undo2 className="w-16 h-16 text-muted-foreground" />
      <p className="text-muted-foreground font-body text-center">يرجى تسجيل الدخول لإدارة المرتجعات</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      <div className="pt-20 pb-32 max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4 mt-4">
          <h1 className="font-heading font-bold text-xl flex items-center gap-2"><Undo2 className="w-5 h-5 text-primary" /> طلبات الإرجاع والاستبدال</h1>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 ml-1" /> طلب جديد</Button>
          )}
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-4 mb-4 space-y-3">
            <h3 className="font-bold text-sm">طلب إرجاع / استبدال</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">الطلب الأصلي (اختياري)</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value, product_id: '' }))}>
                <option value="">اختر طلباً تم تسليمه</option>
                {orders.map(o => <option key={o.id} value={o.id}>#{o.order_number || o.id?.slice(-6)}</option>)}
              </select>
            </div>
            {form.order_id && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">المنتج</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                  <option value="">اختر منتجاً</option>
                  {orders.find(o => o.id === form.order_id)?.items?.map((it, i) => (
                    <option key={`${it.product_id}-${i}`} value={it.product_id}>{it.title}</option>
                  ))}
                </select>
              </div>
            )}
            {!form.order_id && <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">طلبات الإرجاع مرتبطة بطلبات تم تسليمها فعلياً لحماية العميل والمتجر.</p>}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">نوع الطلب</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="return">استرجاع</option>
                <option value="exchange">استبدال</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">سبب الإرجاع</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                {Object.entries(reasonLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">تفاصيل</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="اشرح المشكلة بالتفصيل..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">{submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </motion.div>
        )}

        {/* Returns List */}
        <div className="space-y-2">
          {returns.length === 0 && !showForm && (
            <div className="text-center py-12 bg-card border border-border/50 rounded-2xl">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">لا توجد طلبات إرجاع بعد</p>
              <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 ml-1" /> طلب إرجاع جديد</Button>
            </div>
          )}
          {returns.map(ret => (
            <div key={ret.id} className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">#{ret.request_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ret.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[ret.status] || ret.status}
                </span>
              </div>
              <p className="text-sm font-medium">{ret.product_title}</p>
              <p className="text-xs text-muted-foreground mt-1">السبب: {reasonLabels[ret.reason]}</p>
              {ret.description && <p className="text-xs text-muted-foreground mt-1">{ret.description}</p>}
              <p className="text-[11px] text-muted-foreground mt-2">{new Date(ret.created_date).toLocaleDateString('ar-EG')}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}