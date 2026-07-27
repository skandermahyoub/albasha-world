import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Repeat, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const FREQ_OPTIONS = [
  { value: 'weekly', label: 'أسبوعياً', days: 7 },
  { value: 'biweekly', label: 'كل أسبوعين', days: 14 },
  { value: 'monthly', label: 'شهرياً', days: 30 },
];

export default function SubscribeButton({ product, qty = 1, format }) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [saving, setSaving] = useState(false);

  if (!product?.is_subscribable) return null;

  const discount = product.subscription_discount || 10;
  const discountedPrice = product.price ? Math.round(product.price * (1 - discount / 100)) : 0;

  const handleSubscribe = async () => {
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('manage-subscription', {
        action: 'create',
        product_id: product.id,
        quantity: qty,
        frequency,
      });
      const data = res.data;
      if (!data?.success) {
        toast.error(data?.error || 'فشل تفعيل الاشتراك');
        setSaving(false);
        return;
      }
      setOpen(false);
      toast.success('🎉 تم تفعيل اشتراكك! ستتم جدولة التوصيل بسعر مخفّض');
    } catch (err) {
      toast.error('حدث خطأ في الاتصال');
    }
    setSaving(false);
  };

  return (
    <div className="border border-primary/20 rounded-2xl overflow-hidden bg-primary/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Repeat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">اشترك ووفّر {discount}%</p>
            <p className="text-xs text-muted-foreground">إدارة وجدولة الاشتراك بسعر مخفّض</p>
          </div>
        </div>
        <span className="text-primary font-bold text-sm">{format ? format(discountedPrice) : discountedPrice}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">اختر تكرار التوصيل:</p>
              <div className="grid grid-cols-3 gap-2">
                {FREQ_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFrequency(opt.value)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${frequency === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubscribe}
                disabled={saving}
                className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving ? 'جاري التفعيل...' : <><Check className="w-4 h-4" /> فعّل الاشتراك الآن</>}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">يمكنك الإيقاف أو الإلغاء في أي وقت من حسابي</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}