import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Gift, CheckCircle, Loader2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import useCurrency from '@/lib/useCurrency';

const AMOUNTS = [50, 100, 200, 500, 1000];

export default function GiftCards() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const [user, setUser] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [form, setForm] = useState({ amount: 100, to_email: '', message: '' });
  const [checkCode, setCheckCode] = useState('');
  const [checkedCard, setCheckedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [s, me] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setSettings(s[0] || {});
      setUser(me);
      if (me) {
        const cards = await base44.functions.invoke('get-my-gift-cards', {}).then(res => res.data?.cards || []).catch(() => []);
        setMyCards(cards);
      }
    };
    load();
  }, []);

  const sendCard = async () => {
    if (!form.to_email) return toast.error('أدخل بريد المستلم');
    if (!user) return toast.error('يرجى تسجيل الدخول أولاً');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('purchase-gift-card', {
        amount: form.amount,
        to_email: form.to_email,
        message: form.message,
      });
      const data = res.data;
      if (!data?.success) {
        toast.error(data?.error || 'فشل إرسال البطاقة');
        setLoading(false);
        return;
      }
      toast.success('تم استلام طلب بطاقة الهداية! سيتم تفعيلها بعد معالجة الدفع.');
      setSent(true);
      setLoading(false);
      const cards = await base44.functions.invoke('get-my-gift-cards', {}).then(res => res.data?.cards || []).catch(() => []);
      setMyCards(cards);
    } catch (err) {
      toast.error('حدث خطأ في الاتصال');
      setLoading(false);
    }
  };

  const checkCardBalance = async () => {
    if (!checkCode.trim()) return;
    const res = await base44.functions.invoke('get-gift-card-status', { code: checkCode.toUpperCase() }).catch(() => null);
    const card = res?.data?.success ? res.data.card : null;
    setCheckedCard(card);
    if (!card) toast.error(res?.data?.error || 'كود غير صحيح');
  };

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 pb-28 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-3xl">بطاقات الهدايا</h1>
          <p className="text-muted-foreground text-sm mt-2">أهدِ من تحب تجربة التسوق الراقية في {settings?.store_name || 'متجري'}</p>
        </div>

        {!sent ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/50 p-6 space-y-5 mb-6">
            <h2 className="font-heading font-bold text-lg">إرسال بطاقة هدية</h2>

            {/* Amount Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">اختر القيمة</label>
              <div className="grid grid-cols-5 gap-2">
                {AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setForm(f => ({ ...f, amount: amt }))}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${form.amount === amt ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-transparent hover:border-primary/50'}`}
                  >
                    {amt}
                    <span className="text-[10px] block">{currency.CURRENCY_LABELS[currency.currency] || currency.currency}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input placeholder="البريد الإلكتروني للمستلم *" type="email" value={form.to_email} onChange={e => setForm(f => ({ ...f, to_email: e.target.value }))} />
            <Textarea placeholder="رسالة شخصية (اختياري)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} />

            <Button onClick={sendCard} disabled={loading} className="w-full h-11 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              إرسال بطاقة بقيمة {form.amount} {currency.CURRENCY_LABELS[currency.currency] || currency.currency}
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-xl text-orange-700 dark:text-orange-400">تم الإرسال!</h3>
            <p className="text-sm text-orange-600 dark:text-orange-500 mt-2">تم استلام طلب بطاقة بقيمة {form.amount} {currency.CURRENCY_LABELS[currency.currency] || currency.currency} إلى {form.to_email}</p>
            <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">سيتم تفعيل البطاقة بعد معالجة الدفع</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSent(false); setForm({ amount: 100, to_email: '', message: '' }); }}>
              إرسال بطاقة أخرى
            </Button>
          </motion.div>
        )}

        {/* Check Balance */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 mb-6">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> التحقق من رصيد بطاقة</h3>
          <div className="flex gap-2">
            <Input placeholder="أدخل الكود (مثال: BASHA-ABC123)" value={checkCode} onChange={e => setCheckCode(e.target.value)} className="flex-1" />
            <Button variant="outline" onClick={checkCardBalance}>تحقق</Button>
          </div>
          {checkedCard && (
            <div className={`mt-3 p-3 rounded-xl text-sm ${checkedCard.status === 'active' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700' : checkedCard.status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' : 'bg-secondary text-muted-foreground'}`}>
              {checkedCard.status === 'active' ? (
                <>✅ بطاقة نشطة | الرصيد المتبقي: <strong>{checkedCard.amount - (checkedCard.used_amount || 0)} {currency.CURRENCY_LABELS[checkedCard.currency] || checkedCard.currency}</strong> من {checkedCard.amount} {currency.CURRENCY_LABELS[checkedCard.currency] || checkedCard.currency}</>
              ) : checkedCard.status === 'pending' ? (
                <>⏳ هذه البطاقة بانتظار التفعيل</>
              ) : (
                <>❌ هذه البطاقة {checkedCard.status === 'used' ? 'مستخدمة' : 'منتهية الصلاحية'}</>
              )}
            </div>
          )}
        </div>

        {/* My Sent Cards */}
        {myCards.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <h3 className="font-bold text-base mb-3">بطاقاتي المُرسلة ({myCards.length})</h3>
            <div className="space-y-2">
              {myCards.map(card => (
                <div key={card.id} className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3 text-sm">
                  <div>
                    <p className="font-bold font-mono">{card.code}</p>
                    <p className="text-xs text-muted-foreground">إلى: {card.issued_to_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{card.amount} {currency.CURRENCY_LABELS[card.currency] || card.currency}</p>
                    <p className={`text-xs ${card.status === 'active' ? 'text-orange-600' : card.status === 'pending' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {card.status === 'active' ? 'نشطة' : card.status === 'pending' ? 'بانتظار التفعيل' : card.status === 'used' ? 'مستخدمة' : 'منتهية'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}