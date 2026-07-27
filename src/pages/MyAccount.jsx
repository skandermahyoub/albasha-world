import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { motion } from 'framer-motion';
import { User, Package, Star, ChevronLeft, LogOut, Heart, Gift, ShoppingBag, Crown, Wallet, Users2, Undo2, Ticket as TicketIcon } from 'lucide-react';
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
        const [o, lp, profs] = await Promise.all([
              base44.entities.Order.filter({ customer_email: me.email }, '-created_date', 100).catch(() => []),
          base44.entities.LoyaltyPoints.filter({ user_email: me.email }).catch(() => []),
          base44.entities.CustomerProfile.filter({ user_email: me.email }).catch(() => []),
        ]);
        setOrders(o);
        setLoyalty(lp[0] || null);
        setProfile(profs[0] || null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const submitDeliveryRating = async (orderId, rating) => {
    await base44.entities.Order.update(orderId, { delivery_rating: rating });
    toast.success('شكراً لتقييمك!');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_rating: rating } : o));
  };

  const saveProfile = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me?.email) return;
    const data = { full_name: profile.full_name, id_number: profile.id_number, address: profile.address, profile_photo: profile.profile_photo };
    if (profile.id) {
      await base44.entities.CustomerProfile.update(profile.id, data);
    } else {
      await base44.entities.CustomerProfile.create({ user_email: me.email, name: me.full_name || '', ...data });
    }
    toast.success('تم حفظ بياناتك');
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
                  <span className="font-bold text-sm text-primary">{order.total} {order.currency || 'USD'}</span>
                </div>
              </div>
            ))}
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