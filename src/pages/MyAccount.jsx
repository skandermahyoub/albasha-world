import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { motion } from 'framer-motion';
import { User, Package, Star, ChevronLeft, LogOut, Heart, Gift, ShoppingBag, Crown, Wallet, Users2, Undo2, Ticket as TicketIcon, Repeat, Pause, Play, XCircle } from 'lucide-react';
import LevelProgressBar from '@/components/home/LevelProgressBar';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function MyAccount() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionBusy, setSubscriptionBusy] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, me] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setSettings(s[0] || {});
      setUser(me);
      if (me) {
        const [o, lp, profileRes, subs] = await Promise.all([
          base44.functions.invoke('get-my-orders', {}).then(res => res.data?.orders || []).catch(() => []),
          base44.entities.LoyaltyPoints.filter({ user_email: me.email }).catch(() => []),
          base44.functions.invoke('get-my-profile', {}).then(res => res.data?.profile || null).catch(() => null),
          base44.functions.invoke('get-my-subscriptions', {}).then(res => res.data?.subscriptions || []).catch(() => []),
        ]);
        setOrders(o);
        setLoyalty(lp[0] || null);
        setProfile(profileRes);
        setSubscriptions(subs);
      }
      setLoading(false);
    };
    load();
  }, []);

  const submitDeliveryRating = async (orderId, rating) => {
    try {
      const res = await base44.functions.invoke('submit-delivery-rating', { order_id: orderId, rating });
      if (!res.data?.success) return toast.error(res.data?.error || 'تعذر حفظ التقييم');
      toast.success('شكراً لتقييمك!');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_rating: rating } : o));
    } catch {
      toast.error('تعذر حفظ التقييم');
    }
  };

  const saveProfile = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me?.email) return;
    try {
      const data = { full_name: profile?.full_name || '', id_number: profile?.id_number || '', address: profile?.address || '', profile_photo: profile?.profile_photo || '' };
      const res = await base44.functions.invoke('update-my-profile', data);
      if (!res.data?.success) return toast.error(res.data?.error || 'تعذر حفظ بياناتك');
      setProfile(res.data.profile || { ...profile, ...data });
      toast.success('تم حفظ بياناتك');
    } catch {
      toast.error('تعذر حفظ بياناتك');
    }
  };

  const manageSubscription = async (subscription, action) => {
    if (!subscription?.id || subscriptionBusy) return;
    setSubscriptionBusy(subscription.id + ':' + action);
    try {
      const res = await base44.functions.invoke('manage-subscription', { action, subscription_id: subscription.id });
      if (!res.data?.success) return toast.error(res.data?.error || 'تعذر تحديث الاشتراك');
      const refreshed = await base44.functions.invoke('get-my-subscriptions', {}).then(r => r.data?.subscriptions || []).catch(() => subscriptions);
      setSubscriptions(refreshed);
      toast.success(action === 'pause' ? 'تم إيقاف الاشتراك مؤقتاً' : action === 'resume' ? 'تم استئناف الاشتراك' : 'تم إلغاء الاشتراك');
    } catch {
      toast.error('تعذر تحديث الاشتراك');
    } finally {
      setSubscriptionBusy(null);
    }
  };

  const SUBSCRIPTION_FREQ = { weekly: 'أسبوعياً', biweekly: 'كل أسبوعين', monthly: 'شهرياً' };
  const SUBSCRIPTION_STATUS = {
    active: { label: 'نشط', cls: 'bg-green-100 text-green-700' },
    paused: { label: 'متوقف مؤقتاً', cls: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'ملغي', cls: 'bg-red-100 text-red-700' },
  };

  const STATUS_MAP = {
    pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'تم التأكيد', color: 'bg-blue-100 text-blue-700' },
    preparing: { label: 'قيد التجهيز', color: 'bg-purple-100 text-purple-700' },
    shipped: { label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'تم التسليم', color: 'bg-orange-100 text-orange-700' },
    cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <User className="w-16 h-16 text-muted-foreground" />
      <p className="text-muted-foreground font-body text-center">يرجى تسجيل الدخول لعرض حسابك</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      <div className="pt-20 pb-32 max-w-2xl mx-auto px-4">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-purple-800 rounded-2xl p-5 text-white mb-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user.full_name?.[0] || '👤'}
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">{user.full_name || 'مرحباً'}</h2>
              <p className="text-white/70 text-sm">{user.email}</p>
            </div>
          </div>
          {loyalty && (
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-6">
              <div>
                <p className="text-white/60 text-xs">نقاط الولاء</p>
                <p className="font-bold text-xl">{loyalty.points || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">إجمالي الطلبات</p>
                <p className="font-bold text-xl">{orders.length}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-secondary rounded-xl p-1 items-center">
          {[
            { key: 'overview', label: 'نظرة عامة', icon: User },
            { key: 'orders', label: 'طلباتي', icon: Package },
            { key: 'subscriptions', label: 'اشتراكاتي', icon: Repeat },
            { key: 'loyalty', label: 'نقاطي', icon: Star },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Profile editor */}
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2"><User className="w-4 h-4 text-primary" /> بياناتي</h3>
              <div className="flex gap-3 items-start">
                {profile?.profile_photo ? <img src={profile.profile_photo} alt="" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>}
                <Input placeholder="رابط الصورة الشخصية" value={profile?.profile_photo || ''} onChange={e => setProfile(p => ({ ...p, profile_photo: e.target.value }))} className="flex-1" />
              </div>
              <Input placeholder="الاسم الرباعي" value={profile?.full_name || ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
              <Input placeholder="رقم الهوية" value={profile?.id_number || ''} onChange={e => setProfile(p => ({ ...p, id_number: e.target.value }))} />
              <Input placeholder="العنوان" value={profile?.address || ''} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
              <Button size="sm" onClick={saveProfile} className="w-full">حفظ البيانات</Button>
            </div>
            {orders.length > 0 && (
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> أحدث الطلبات</h3>
                  <button onClick={() => setTab('orders')} className="text-xs text-primary hover:underline">عرض الكل</button>
                </div>
                <div className="space-y-2">
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium">#{order.order_number || order.id?.slice(-6)}</span>
                      <span className={`px-2 py-0.5 rounded-full ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>{STATUS_MAP[order.status]?.label || order.status}</span>
                      <span className="font-bold text-primary">{order.total} {order.currency || 'USD'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {[
              { label: 'تتبع طلب', icon: Package, to: '/order-tracking' },
              { label: 'المفضلة', icon: Heart, to: '/favorites' },
              { label: 'قوائم الرغبات', icon: ShoppingBag, to: '/wishlists' },
              { label: 'بطاقات الهدايا', icon: Gift, to: '/gift-cards' },
              { label: 'محفظتي الرقمية', icon: Wallet, to: '/my-wallet' },
              { label: 'التسويق بالعمولة', icon: Users2, to: '/affiliate' },
              { label: 'المرتجعات', icon: Undo2, to: '/returns' },
              { label: 'تذاكر الدعم', icon: TicketIcon, to: '/tickets' },
              { label: 'تسوق الآن', icon: Star, to: '/shop' },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
            <button onClick={() => base44.auth.logout()}
              className="w-full flex items-center justify-between bg-card border border-border/50 rounded-xl p-4 hover:border-destructive/50 transition-colors text-destructive">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">تسجيل الخروج</span>
              </div>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {orders.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد طلبات بعد</p>
              </div>
            )}
            {orders.map(order => (
              <div key={order.id} className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">#{order.order_number || order.id?.slice(-6)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_MAP[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_MAP[order.status]?.label || order.status}
                  </span>
                </div>
                <div className="space-y-0.5 mb-2">
                  {order.items?.slice(0, 2).map((item, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{item.title} × {item.quantity}</p>
                  ))}
                  {order.items?.length > 2 && <p className="text-xs text-muted-foreground">+{order.items.length - 2} منتجات أخرى</p>}
                </div>
                {/* Status history timeline */}
                {order.status_history?.length > 0 && (
                  <div className="mb-2 space-y-0.5 border-r-2 border-primary/20 pr-3">
                    {order.status_history.map((h, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground">
                        {STATUS_MAP[h.status]?.label || h.status} — {h.date ? new Date(h.date).toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    ))}
                  </div>
                )}
                {/* Delivery rating */}
                {order.status === 'delivered' && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">تقييم التوصيل:</span>
                    {order.delivery_rating ? (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-4 h-4 ${n <= order.delivery_rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => submitDeliveryRating(order.id, n)}>
                            <Star className="w-4 h-4 text-muted-foreground/30 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">{order.created_date ? new Date(order.created_date).toLocaleDateString('ar-SA') : ''}</span>
                  <Link to={`/orders/${order.order_number}`} className="text-xs font-bold text-primary">عرض التفاصيل</Link>
                  <span className="font-bold text-sm text-primary">{order.total} {order.currency || 'USD'}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Subscriptions */}
        {tab === 'subscriptions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border/50 rounded-2xl">
                <Repeat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium">لا توجد اشتراكات دورية</p>
                <p className="text-xs text-muted-foreground mt-1">المنتجات التي تدعم الاشتراك ستظهر لك هنا بعد تفعيلها.</p>
                <Link to="/shop"><Button size="sm" className="mt-4">تصفح المنتجات</Button></Link>
              </div>
            ) : subscriptions.map(sub => {
              const status = SUBSCRIPTION_STATUS[sub.status] || SUBSCRIPTION_STATUS.active;
              const busy = subscriptionBusy?.startsWith(sub.id + ':');
              return (
                <div key={sub.id} className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex gap-3 items-start">
                    {sub.product_image ? <img src={sub.product_image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-muted-foreground" /></div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm truncate">{sub.product_title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${status.cls}`}>{status.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{SUBSCRIPTION_FREQ[sub.frequency] || sub.frequency} · الكمية {sub.quantity || 1} · خصم {sub.discount_percent || 0}%</p>
                      <p className="text-sm font-bold text-primary mt-1">{sub.price} {settings?.currency || 'USD'}</p>
                      {sub.next_delivery && sub.status === 'active' && <p className="text-[11px] text-muted-foreground mt-1">التوصيل القادم: {new Date(sub.next_delivery).toLocaleDateString('ar-SA')}</p>}
                    </div>
                  </div>
                  {sub.status !== 'cancelled' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
                      {sub.status === 'active' ? (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => manageSubscription(sub, 'pause')} className="flex-1"><Pause className="w-3.5 h-3.5 ml-1" /> إيقاف مؤقت</Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => manageSubscription(sub, 'resume')} className="flex-1"><Play className="w-3.5 h-3.5 ml-1" /> استئناف</Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => manageSubscription(sub, 'cancel')} className="flex-1 text-destructive border-destructive/30"><XCircle className="w-3.5 h-3.5 ml-1" /> إلغاء</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Loyalty */}
        {tab === 'loyalty' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Level Progress Bar */}
            <LevelProgressBar points={loyalty?.points || 0} />

            {/* Points history */}
            {loyalty?.history?.length > 0 && (
              <div>
                <h3 className="font-bold text-sm mb-3">سجل النقاط</h3>
                <div className="space-y-2">
                  {loyalty.history.slice(-10).reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium">{h.description}</p>
                        <p className="text-xs text-muted-foreground">{h.date}</p>
                      </div>
                      <span className={`font-bold text-sm ${h.points > 0 ? 'text-orange-600' : 'text-red-500'}`}>
                        {h.points > 0 ? '+' : ''}{h.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!loyalty && (
              <div className="text-center py-6 bg-card border border-border/50 rounded-2xl">
                <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">ابدأ التسوق لتكسب نقاط الولاء وترتفع في المستويات!</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}