import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { motion } from 'framer-motion';
import { Ticket as TicketIcon, Plus, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Tickets() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium', description: '' });

  useEffect(() => {
    const load = async () => {
      const [s, me] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setSettings(s[0] || {});
      setUser(me);
      if (me) {
        const t = await base44.entities.Ticket.filter({ customer_email: me.email }, '-created_date', 50).catch(() => []);
        setTickets(t);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.subject || !form.description) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }
    setSubmitting(true);
    try {
      const ticketNum = `TKT-${Date.now().toString().slice(-6)}`;
      await base44.entities.Ticket.create({
        ...form,
        ticket_number: ticketNum,
        customer_name: user.full_name || '',
        customer_email: user.email,
        customer_phone: '',
        status: 'open',
        messages: [{
          sender: user.full_name || 'العميل',
          sender_role: 'customer',
          message: form.description,
          timestamp: new Date().toISOString(),
        }],
      });
      toast.success('تم إنشاء التذكرة بنجاح');
      setShowForm(false);
      setForm({ subject: '', category: 'general', priority: 'medium', description: '' });
      const t = await base44.entities.Ticket.filter({ customer_email: user.email }, '-created_date', 50).catch(() => []);
      setTickets(t);
    } catch (err) {
      toast.error('فشل إنشاء التذكرة');
    }
    setSubmitting(false);
  };

  const categoryLabels = {
    order_issue: 'مشكلة طلب', product_issue: 'مشكلة منتج', payment_issue: 'مشكلة دفع',
    shipping_issue: 'مشكلة شحن', account_issue: 'مشكلة حساب', general: 'استفسار عام', complaint: 'شكوى',
  };

  const priorityLabels = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    open: 'مفتوحة', in_progress: 'قيد المعالجة', waiting_customer: 'بانتظار ردك',
    resolved: 'تم الحل', closed: 'مغلقة',
  };
  const statusColors = {
    open: 'bg-green-100 text-green-700', in_progress: 'bg-blue-100 text-blue-700',
    waiting_customer: 'bg-yellow-100 text-yellow-700', resolved: 'bg-purple-100 text-purple-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <TicketIcon className="w-16 h-16 text-muted-foreground" />
      <p className="text-muted-foreground font-body text-center">يرجى تسجيل الدخول للوصول لنظام التذاكر</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      <div className="pt-20 pb-32 max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4 mt-4">
          <h1 className="font-heading font-bold text-xl flex items-center gap-2"><TicketIcon className="w-5 h-5 text-primary" /> تذاكر الدعم الفني</h1>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 ml-1" /> تذكرة جديدة</Button>
          )}
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-4 mb-4 space-y-3">
            <h3 className="font-bold text-sm">إنشاء تذكرة دعم</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">الموضوع</label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="اكتب موضوع المشكلة" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الفئة</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الأولوية</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {Object.entries(priorityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">تفاصيل المشكلة</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="اشرح مشكلتك بالتفصيل..." rows={4} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? 'جاري الإنشاء...' : 'إنشاء التذكرة'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </motion.div>
        )}

        {/* Tickets List */}
        <div className="space-y-2">
          {tickets.length === 0 && !showForm && (
            <div className="text-center py-12 bg-card border border-border/50 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">لا توجد تذاكر بعد</p>
              <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 ml-1" /> إنشاء تذكرة</Button>
            </div>
          )}
          {tickets.map(t => (
            <div key={t.id} className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">#{t.ticket_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[t.status] || t.status}
                </span>
              </div>
              <p className="text-sm font-medium">{t.subject}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{categoryLabels[t.category] || t.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || priorityColors.medium}`}>
                  {priorityLabels[t.priority] || t.priority}
                </span>
              </div>
              {t.messages?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{t.messages[0].message}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">{new Date(t.created_date).toLocaleDateString('ar-EG')}</p>
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