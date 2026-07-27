import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Repeat, Calendar, Pause, Play, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

const FREQ_LABELS = { weekly: 'أسبوعياً', biweekly: 'كل أسبوعين', monthly: 'شهرياً' };
const STATUS_STYLES = {
  active: 'bg-orange-100 text-orange-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};
const STATUS_LABELS = { active: 'نشط', paused: 'متوقف', cancelled: 'ملغي' };

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => base44.entities.Subscription.list('-created_date', 100).then(s => { setSubs(s); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggleStatus = async (sub) => {
    const next = sub.status === 'active' ? 'paused' : 'active';
    await base44.entities.Subscription.update(sub.id, { status: next });
    toast.success(next === 'active' ? 'تم تفعيل الاشتراك' : 'تم إيقاف الاشتراك');
    load();
  };

  const cancel = async (id) => {
    if (!confirm('هل تريد إلغاء هذا الاشتراك؟')) return;
    await base44.entities.Subscription.update(id, { status: 'cancelled' });
    toast.success('تم الإلغاء'); load();
  };

  const activeCount = subs.filter(s => s.status === 'active').length;
  const mrr = subs.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">الاشتراكات الدورية</h1>
          <p className="text-sm text-muted-foreground">إدارة اشتراكات العملاء المتكررة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <Repeat className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-heading font-bold">{activeCount}</p>
          <p className="text-xs text-muted-foreground">اشتراكات نشطة</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <Calendar className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-2xl font-heading font-bold">{mrr.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">دخل شهري متكرر (ر.س)</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <Package className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-2xl font-heading font-bold">{subs.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الاشتراكات</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {subs.map(sub => (
          <div key={sub.id} className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3">
            {sub.product_image ? (
              <img src={sub.product_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-muted-foreground" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{sub.product_title}</p>
              <p className="text-xs text-muted-foreground truncate">{sub.customer_name || sub.user_email} • {FREQ_LABELS[sub.frequency]} • ×{sub.quantity || 1}</p>
              {sub.next_delivery && sub.status === 'active' && (
                <p className="text-[11px] text-primary mt-0.5">التوصيل القادم: {new Date(sub.next_delivery).toLocaleDateString('ar-SA')}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[sub.status]}`}>{STATUS_LABELS[sub.status]}</span>
              <span className="text-sm font-bold">{sub.price} ر.س</span>
            </div>
            {sub.status !== 'cancelled' && (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleStatus(sub)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                  {sub.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => cancel(sub.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {subs.length === 0 && <p className="text-center text-muted-foreground py-16">لا توجد اشتراكات بعد</p>}
      </div>
    </div>
  );
}