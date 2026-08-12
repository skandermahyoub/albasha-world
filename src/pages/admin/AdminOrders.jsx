import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageCircle, Clock, CheckCircle2, Package, Truck, XCircle, ChevronDown, ChevronUp, Lock, Calendar, MapPin, StickyNote, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { getStores } from '@/lib/navLinks';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد المراجعة' },
  { value: 'confirmed', label: 'تم التأكيد' },
  { value: 'preparing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'cancelled', label: 'ملغي' },
];

// الحالات التي لا يمكن الرجوع منها
const LOCKED_STATUSES = ['delivered', 'cancelled'];

// الحالات الحالية (غير مكتملة)
const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped'];
// الحالات السابقة (مكتملة أو ملغاة)
const PAST_STATUSES = ['delivered', 'cancelled'];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const RATING_INFO = {
  excellent: { label: 'عميل ممتاز', cls: 'bg-green-100 text-green-700' },
  good: { label: 'عميل جيد', cls: 'bg-blue-100 text-blue-700' },
  bad: { label: 'عميل سيئ', cls: 'bg-red-100 text-red-700' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('active'); // 'active' | 'past'
  const [confirmDialog, setConfirmDialog] = useState(null); // { order, newStatus }
  const [deleteDialog, setDeleteDialog] = useState(null); // order
  const urlParams = new URLSearchParams(window.location.search);
  const [expandedOrder, setExpandedOrder] = useState(urlParams.get('order'));
  const [products, setProducts] = useState([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [profiles, setProfiles] = useState({});
  const { user } = useAuth();
  const STORES = getStores(settings?.theme_config || {});

  const load = async () => {
    const [o, s, p, profs] = await Promise.all([
      base44.entities.Order.list('-created_date', 500).catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
      base44.entities.Product.list('-created_date', 500).catch(() => []),
      base44.entities.CustomerProfile.list('-created_date', 500).catch(() => []),
    ]);
    setOrders(o);
    setSettings(s[0] || {});
    setProducts(p);
    const map = {};
    profs.forEach(pr => {
      if (pr.user_email) map[pr.user_email.toLowerCase()] = pr;
      if (pr.phone) map['p:' + pr.phone.replace(/\D/g, '')] = pr;
    });
    setProfiles(map);
  };
  useEffect(() => { load(); }, []);

  const requestStatusChange = (order, newStatus) => {
    // منع الرجوع بعد التسليم أو الإلغاء
    if (LOCKED_STATUSES.includes(order.status)) {
      toast.error(`لا يمكن تغيير حالة الطلب بعد "${STATUS_OPTIONS.find(s => s.value === order.status)?.label}"`);
      return;
    }
    setConfirmDialog({ order, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!confirmDialog) return;
    const { order, newStatus } = confirmDialog;

    // استدعاء الوظيفة الخلفية الموحدة لتحديث الحالة + المخزون + المبيعات
    const res = await base44.functions.invoke('update-order-status', {
      order_id: order.id,
      new_status: newStatus,
      performed_by: user?.full_name || user?.email || 'موظف',
    });

    if (!res.data?.success) {
      toast.error(res.data?.error || 'فشل تحديث حالة الطلب');
      setConfirmDialog(null);
      return;
    }
    toast.success('تم تحديث حالة الطلب');
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; gain.gain.value = 0.2;
      osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 200);
    } catch {}

    const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label;

    // إشعار تلقائي للعميل بالبريد الإلكتروني
    if (order.customer_email) {
      base44.integrations.Core.SendEmail({
        to: order.customer_email,
        subject: `تحديث حالة طلبك #${order.order_number || order.id.slice(-6)}`,
        body: `مرحباً ${order.customer_name}،\n\nتم تحديث حالة طلبك رقم #${order.order_number || order.id.slice(-6)} إلى: ${statusLabel}\n\nشكراً لتسوقك من عالم الباشا للتسوق.`,
      }).catch(() => {});
    }

    // إشعار العميل عبر واتساب
    if (order.customer_phone) {
      const msg = `تحديث طلبك رقم #${order.order_number || order.id.slice(-6)}\n\nالحالة الجديدة: ${statusLabel}\n\nشكراً لتسوقك منا.`;
      window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    setConfirmDialog(null);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    await base44.entities.Order.delete(deleteDialog.id);
    toast.success('تم حذف الطلب');
    setDeleteDialog(null);
    if (expandedOrder === deleteDialog.id) setExpandedOrder(null);
    load();
  };

  const productStoreMap = {};
  products.forEach(p => { if (p.id) productStoreMap[p.id] = p.store_key; });

  const orderStoreKey = (order) => {
    const stores = (order.items || []).map(i => productStoreMap[i.product_id]).filter(Boolean);
    return stores[0] || null;
  };

  const filteredByStore = orders.filter(o => storeFilter === 'all' || orderStoreKey(o) === storeFilter);
  const activeOrders = filteredByStore.filter(o => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = filteredByStore.filter(o => PAST_STATUSES.includes(o.status));
  const transferOrders = filteredByStore.filter(o => o.payment_method && /تحويل|حوال|bank|transfer/i.test(o.payment_method));
  const discountedOrders = filteredByStore.filter(o => (o.discount && o.discount > 0) && PAST_STATUSES.includes(o.status));
  const displayedOrders = tab === 'active' ? activeOrders : tab === 'past' ? pastOrders : tab === 'transfers' ? transferOrders : discountedOrders;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return format(new Date(dateStr), 'dd/MM/yyyy HH:mm'); } catch { return dateStr; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-2xl">الطلبات</h1>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
          حالية: {activeOrders.length} | سابقة: {pastOrders.length}
        </div>
      </div>

      {/* Store filter */}
      <div className="flex gap-1 mb-3 flex-wrap">
        <button onClick={() => setStoreFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${storeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>كل النشاطات</button>
        {STORES.map(s => (
          <button key={s.key} onClick={() => setStoreFilter(s.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${storeFilter === s.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{s.name}</button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1 flex-wrap">
        <button onClick={() => setTab('active')} className={`flex-1 min-w-[110px] py-2 rounded-lg text-xs font-medium transition-all ${tab === 'active' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          الحالية ({activeOrders.length})
        </button>
        <button onClick={() => setTab('past')} className={`flex-1 min-w-[110px] py-2 rounded-lg text-xs font-medium transition-all ${tab === 'past' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          السابقة ({pastOrders.length})
        </button>
        <button onClick={() => setTab('transfers')} className={`flex-1 min-w-[110px] py-2 rounded-lg text-xs font-medium transition-all ${tab === 'transfers' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          حوالات ({transferOrders.length})
        </button>
        <button onClick={() => setTab('discounted')} className={`flex-1 min-w-[110px] py-2 rounded-lg text-xs font-medium transition-all ${tab === 'discounted' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          بخصومات ({discountedOrders.length})
        </button>
      </div>

      <div className="space-y-3">
        {displayedOrders.map(order => {
          const isLocked = LOCKED_STATUSES.includes(order.status);
          const StatusIcon = STATUS_ICONS[order.status] || Clock;
          const isExpanded = expandedOrder === order.id;
          const currentUser = user?.full_name || user?.email;
          const assignedToOther = order.assigned_employee && order.assigned_employee !== currentUser;

          return (
            <div key={order.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {/* Header */}
              <div
                className="flex flex-wrap items-start justify-between gap-2 p-4 cursor-pointer"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="min-w-0 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${STATUS_COLORS[order.status]}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">#{order.order_number || order.id.slice(-6)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
                      </span>
                      {isLocked && <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> مغلق</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customer_name} • {order.customer_phone}</p>
                    {(() => {
                      const prof = (order.customer_email && profiles[order.customer_email.toLowerCase()]) || (order.customer_phone && profiles['p:' + order.customer_phone.replace(/\D/g, '')]);
                      if (!prof || !prof.admin_rating) return null;
                      const r = RATING_INFO[prof.admin_rating];
                      return r ? <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.cls}`}>{r.label}</span> : null;
                    })()}
                    <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(order.created_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold shrink-0">{order.total} {order.currency || 'SAR'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3">
                  {/* Items */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">المنتجات:</p>
                    <div className="space-y-0.5">
                      {order.items?.map((item, i) => (
                        <div key={i} className="text-sm flex justify-between">
                          <span>{item.title} × {item.quantity}</span>
                          <span className="text-muted-foreground">{item.price * item.quantity} {order.currency || 'SAR'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.discount > 0 && (
                    <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1 inline-flex items-center gap-1 w-fit">قيمة الخصم: {order.discount} {order.currency || 'SAR'}</p>
                  )}
                  {/* Address & notes */}
                  {order.address && <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.address}</p>}
                  {order.expected_delivery && <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> التسليم المتوقع: {formatDate(order.expected_delivery)}</p>}
                  {order.notes && <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><StickyNote className="w-3 h-3" /> {order.notes}</p>}
                  {order.assigned_employee && <p className="text-xs text-primary inline-flex items-center gap-1"><Lock className="w-3 h-3" /> محجوز لـ: {order.assigned_employee}</p>}

                  {/* Status history */}
                  {order.status_history?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">سجل الحالات:</p>
                      <div className="space-y-0.5">
                        {order.status_history.map((h, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {STATUS_OPTIONS.find(s => s.value === h.status)?.label} — {formatDate(h.date)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status change */}
                  {!isLocked ? (
                    assignedToOther ? (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 inline-flex items-center justify-center gap-1 w-full">
                        <Lock className="w-3 h-3" /> محجوز لموظف آخر: {order.assigned_employee}
                      </p>
                    ) : (
                    <Select value={order.status} onValueChange={v => requestStatusChange(order, v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-1 bg-secondary rounded-lg inline-flex items-center justify-center gap-1 w-full">
                      <Lock className="w-3 h-3" /> هذا الطلب مغلق ولا يمكن تغيير حالته
                    </p>
                  )}

                  {/* WhatsApp quick contact */}
                  {order.customer_phone && (
                    <a
                      href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-orange-600 hover:underline"
                    >
                      <MessageCircle className="w-3 h-3" /> تواصل مع العميل
                    </a>
                  )}

                  {/* حذف الطلب (للطلبات الوهمية أو الملغاة) */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialog(order)}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> حذف الطلب
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {displayedOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-12">لا توجد طلبات</p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير حالة الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد تغيير حالة الطلب{' '}
              <strong>#{confirmDialog?.order?.order_number}</strong>{' '}
              إلى{' '}
              <strong>{STATUS_OPTIONS.find(s => s.value === confirmDialog?.newStatus)?.label}</strong>؟
              {confirmDialog?.newStatus !== 'cancelled' && (
                <span className="block mt-1 text-orange-600 text-xs">سيتم إشعار العميل عبر واتساب.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الطلب نهائياً</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الطلب{' '}
              <strong>#{deleteDialog?.order_number || deleteDialog?.id?.slice(-6)}</strong>{' '}
              نهائياً ولا يمكن التراجع عن ذلك. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}