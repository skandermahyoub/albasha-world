import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Gift, RefreshCcw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyWallet() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
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
        const [profileRes, txns] = await Promise.all([
          base44.functions.invoke('get-my-profile', {}).then(res => res.data?.profile || null).catch(() => null),
          base44.entities.WalletTransaction.filter({ customer_email: me.email }, '-created_date', 50).catch(() => []),
        ]);
        setProfile(profileRes);
        setTransactions(txns);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <Wallet className="w-16 h-16 text-muted-foreground" />
      <p className="text-muted-foreground font-body text-center">يرجى تسجيل الدخول لعرض محفظتك</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول</Button>
    </div>
  );

  const balance = profile?.wallet_balance || 0;

  const typeIcons = {
    deposit: { icon: ArrowDownLeft, color: 'text-green-600 bg-green-500/10' },
    withdrawal: { icon: ArrowUpRight, color: 'text-red-600 bg-red-500/10' },
    refund: { icon: RefreshCcw, color: 'text-blue-600 bg-blue-500/10' },
    gift: { icon: Gift, color: 'text-purple-600 bg-purple-500/10' },
    purchase: { icon: ShoppingBag, color: 'text-orange-600 bg-orange-500/10' },
    cashback: { icon: TrendingUp, color: 'text-green-600 bg-green-500/10' },
  };

  const typeLabels = {
    deposit: 'إيداع', withdrawal: 'سحب', refund: 'استرداد',
    gift: 'هدية', purchase: 'شراء', cashback: 'استرداد نقدي',
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      <div className="pt-20 pb-32 max-w-2xl mx-auto px-4">
        {/* Wallet Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-purple-800 rounded-2xl p-6 text-white mb-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-white/80" />
            <span className="text-white/60 text-sm font-body">المحفظة الرقمية</span>
          </div>
          <p className="text-white/60 text-sm font-body mb-1">الرصيد المتاح</p>
          <p className="font-heading font-bold text-4xl">{balance.toFixed(2)} <span className="text-lg text-white/70">{settings?.currency || 'USD'}</span></p>
          <p className="text-white/50 text-xs mt-3">يمكنك استخدام الرصيد في مشترياتك داخل المتجر</p>
        </motion.div>

        {/* Transactions */}
        <h3 className="font-heading font-bold text-lg mb-3">سجل المعاملات</h3>
        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="text-center py-12 bg-card border border-border/50 rounded-2xl">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">لا توجد معاملات بعد</p>
            </div>
          )}
          {transactions.map(txn => {
            const cfg = typeIcons[txn.type] || typeIcons.deposit;
            const Icon = cfg.icon;
            const isCredit = ['deposit', 'refund', 'gift', 'cashback'].includes(txn.type);
            return (
              <div key={txn.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{txn.description || typeLabels[txn.type]}</p>
                  <p className="text-xs text-muted-foreground">{new Date(txn.created_date).toLocaleString('ar-EG')}</p>
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}{txn.amount?.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{typeLabels[txn.type]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}