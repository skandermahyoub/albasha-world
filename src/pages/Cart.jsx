import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import { useAbandonedCart } from '@/lib/useAbandonedCart';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, ShoppingBag, Ticket, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Cart() {
  const { isDark, toggle } = useTheme();
  const { items, removeItem, updateQty, total, count, clearCart, appliedCoupon, setAppliedCoupon, discountAmount, discountedTotal } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  useAbandonedCart(items, total);

  const applyCouponCode = async () => {
    if (!couponInput.trim()) return toast.error('أدخل كود الخصم');
    const coupons = await base44.entities.Coupon.filter({ code: couponInput.trim().toUpperCase(), is_active: true }).catch(() => []);
    const coupon = coupons[0];
    if (!coupon) return toast.error('كود غير صحيح أو غير مفعّل');
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) return toast.error('هذا الكود لم يبدأ بعد');
    if (coupon.valid_until && new Date(coupon.valid_until) < now) return toast.error('انتهت صلاحية الكود');
    if (coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses) return toast.error('تم استخدام الكود بالكامل');
    if (coupon.min_order_value > 0 && total < coupon.min_order_value) return toast.error(`الحد الأدنى للطلب ${coupon.min_order_value}$`);
    setAppliedCoupon(coupon);
    toast.success(`تم تطبيق خصم ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '$' + coupon.discount_value}`);
    setCouponInput('');
  };

  useEffect(() => {
    base44.entities.StoreSettings.list().then(s => setSettings(s[0] || {})).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} settings={settings} />
        <div className="pt-24 flex flex-col items-center justify-center gap-4 px-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="font-heading font-bold text-xl">سلتك فارغة</h2>
          <p className="text-muted-foreground text-sm">ابدأ بإضافة منتجاتك المفضلة</p>
          <Link to="/shop"><Button>تصفح المتجر</Button></Link>
        </div>
        <Footer settings={settings} />
        <div className="h-20" />
        <BottomNav settings={settings} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={count} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-3xl mx-auto">
        <h1 className="font-heading font-bold text-2xl mb-6">سلة المشتريات ({count})</h1>

        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <motion.div
              key={item.product_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-3 border border-border/50 flex gap-3 items-center"
            >
              <img src={item.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=100'} alt={item.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-sm truncate">{item.title}</h3>
                <p className="text-primary text-sm font-bold">{currency.format(item.price)}</p>
              </div>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
              </div>
              <button onClick={() => removeItem(item.product_id)} className="text-destructive p-2"><Trash2 className="w-4 h-4" /></button>
            </motion.div>
          ))}
        </div>

        {/* Coupon */}
        <div className="bg-card rounded-xl p-4 border border-border/50 space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">{appliedCoupon.code}</span>
                <span className="text-xs text-green-600">-{appliedCoupon.discount_type === 'percentage' ? appliedCoupon.discount_value + '%' : '$' + appliedCoupon.discount_value}</span>
              </div>
              <button onClick={() => setAppliedCoupon(null)} className="text-destructive"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="كود الخصم" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="flex-1 font-bold tracking-wider" />
              <Button variant="outline" onClick={applyCouponCode}>تطبيق</Button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-4 border border-border/50">
          {discountAmount > 0 && (
            <div className="flex justify-between mb-2 text-sm text-green-600">
              <span>خصم</span>
              <span>-{currency.format(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">المجموع</span>
            <span className="font-bold text-lg">{currency.format(discountedTotal)}</span>
          </div>
          <Link to="/checkout" className="block">
            <Button className="w-full h-12 text-base">متابعة الشراء</Button>
          </Link>
        </div>
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}