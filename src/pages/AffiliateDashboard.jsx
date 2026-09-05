import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { motion } from 'framer-motion';
import { Users2, Link2, Copy, MousePointerClick, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AffiliateDashboard() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [affiliate, setAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, me] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setSettings(s[0] || {});
      setUser(me);
      if (me) {
        const affiliateRes = await base44.functions.invoke('get-my-affiliate', {}).then(res => res.data?.affiliate || null).catch(() => null);
        setAffiliate(affiliateRes);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    try {
      const res = await base44.functions.invoke('register-affiliate', {});
      const data = res.data;
      if (!data?.success) {
        toast.error(data?.error || 'فشل التسجيل');
        setRegistering(false);
        return;
      }
      setAffiliate(data.affiliate);
      toast.success('تم التسجيل بنجاح! سيتم مراجعة طلبك');
    } catch (err) {
      toast.error('فشل التسجيل، حاول مرة أخرى');
    }
    setRegistering(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(affiliate?.referral_link || '');
    toast.success('تم نسخ الرابط');
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <Users2 className="w-16 h-16 text-muted-foreground" />
      <p className="text-muted-foreground font-body text-center">يرجى تسجيل الدخول للوصول للوحة المسوق</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول</Button>
    </div>
  );

  const currency = settings?.currency || 'USD';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      <div className="pt-20 pb-32 max-w-2xl mx-auto px-4">
        {!affiliate ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-8 text-center mt-4">
            <Users2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl mb-2">انضم لبرنامج التسويق بالعمولة</h2>
            <p className="text-muted-foreground text-sm mb-6 font-body">سجّل كمسوّق، احصل على رابط وكود خصم خاص بك، واربح عمولة على كل عملية شراء تتم عبرك!</p>
            <Button onClick={handleRegister} disabled={registering} size="lg">
              {registering ? 'جاري التسجيل...' : 'سجّل كمسوّق الآن'}
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4 mt-4">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                affiliate.status === 'active' ? 'bg-green-500/10 text-green-600' :
                affiliate.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                {affiliate.status === 'active' ? '✓ مفعّل' : affiliate.status === 'pending' ? '⏳ قيد المراجعة' : '✕ موقوف'}
              </div>
              <span className="text-xs text-muted-foreground">كودك: <strong className="text-primary font-bold">{affiliate.affiliate_code}</strong></span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <MousePointerClick className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-xs text-muted-foreground">إجمالي النقرات</p>
                <p className="font-heading font-bold text-2xl">{affiliate.total_clicks || 0}</p>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
                <p className="font-heading font-bold text-2xl">{(affiliate.total_sales || 0).toFixed(0)}</p>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <DollarSign className="w-6 h-6 text-orange-500 mb-2" />
                <p className="text-xs text-muted-foreground">العمولة المستحقة</p>
                <p className="font-heading font-bold text-2xl text-primary">{(affiliate.total_commission || 0).toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">{currency}</p>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4">
                <CheckCircle2 className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-xs text-muted-foreground">العمولة المدفوعة</p>
                <p className="font-heading font-bold text-2xl">{(affiliate.paid_commission || 0).toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">{currency}</p>
              </div>
            </div>

            {/* Referral Link */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">رابط الإحالة الخاص بك</h3>
              </div>
              <div className="flex gap-2">
                <input readOnly value={affiliate.referral_link || ''} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs" />
                <Button size="sm" variant="outline" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">شارك هذا الرابط مع أصدقائك — كل عملية شراء عبره تكسبك {affiliate.commission_rate || 5}% عمولة!</p>
            </div>

            {/* Commission Info */}
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl p-4 border border-primary/20">
              <h3 className="font-bold text-sm mb-2 text-primary">معدل العمولة الخاص بك</h3>
              <p className="font-heading font-bold text-3xl text-primary">{affiliate.commission_rate || 5}%</p>
              <p className="text-xs text-muted-foreground mt-1">لكل عملية بيع تتم عبر رابطك أو كودك</p>
            </div>
          </>
        )}
      </div>

      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}