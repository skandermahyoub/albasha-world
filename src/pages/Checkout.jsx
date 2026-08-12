import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Copy, MessageCircle, Wallet, MapPin, Anchor, Truck, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SHIPPING_ORIGIN = 'خور مكسر';

export default function Checkout() {
  const { isDark, toggle } = useTheme();
  const { items, total, count, clearCart, appliedCoupon, setAppliedCoupon, discountAmount, discountedTotal } = useCart();
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [shippingZones, setShippingZones] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', payment: '', shipping_zone_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [includeShipping, setIncludeShipping] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.entities.StoreSettings.list().catch(() => []),
      base44.entities.PaymentMethod.list('sort_order').catch(() => []),
      base44.entities.ShippingZone.list('sort_order').catch(() => []),
    ]).then(([s, pm, sz]) => {
      setSettings(s[0] || {});
      setPaymentMethods(pm.filter(p => p.is_active !== false));
      setShippingZones((sz || []).filter(z => z.is_active !== false));
    });
    // تحميل رصيد المحفظة ونقاط الولاء
    base44.auth.me().then(me => {
      if (me?.email) {
        base44.entities.CustomerProfile.filter({ user_email: me.email }).then(profiles => {
          const profile = profiles[0];
          setWalletBalance(profile?.wallet_balance || 0);
          setForm(current => ({ ...current, name: profile?.full_name || profile?.name || me.full_name || '', phone: profile?.phone || '', address: profile?.address || '' }));
        }).catch(() => {});
        base44.entities.LoyaltyPoints.filter({ user_email: me.email }).then(lps => {
          setLoyaltyPoints(lps[0]?.points || 0);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const loyaltyDiscount = useLoyaltyPoints ? Math.min(loyaltyPoints / 100, discountedTotal) : 0;
  const selectedZone = shippingZones.find(z => z.id === form.shipping_zone_id);
  const shippingOrigin = settings?.shipping_origin_name || 'خور مكسر';
  const insuranceEnabled = settings?.shipping_insurance_enabled !== false;
  const freeShippingEnabled = settings?.free_shipping_enabled === true;
  const freeShippingThreshold = Number(settings?.free_shipping_threshold) || 0;
  const meetsFreeShipping = freeShippingEnabled && freeShippingThreshold > 0 && total >= freeShippingThreshold;
  // تحويل رسوم الشحن من عملة المنطقة إلى عملة العرض
  const convertZoneFee = (zone) => {
    if (!zone) return 0;
    const fee = Number(zone.delivery_fee) || 0;
    const zoneCurrency = zone.currency || 'YER_NEW';
    const rates = settings?.exchange_rates || { USD: 1, SAR: 3.75, YER_OLD: 530, YER_NEW: 1630, AED: 3.67 };
    const usdValue = fee / (rates[zoneCurrency] || 1);
    return usdValue;
  };
  const shippingFee = (includeShipping && selectedZone && !meetsFreeShipping) ? convertZoneFee(selectedZone) : 0;
  const finalTotal = Math.max(0, discountedTotal - loyaltyDiscount) + shippingFee;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return toast.error('أدخل كود الخصم');
    const code = couponCode.trim().toUpperCase();
    try {
      const res = await base44.functions.invoke('validate-discount', {
        code,
        subtotal: total,
      });
      const data = res.data;
      if (!data.valid) {
        toast.error(data.message || 'كود غير صحيح');
        return;
      }
      if (data.type === 'coupon') {
        setAppliedCoupon({
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          discount_amount: data.discount_amount,
        });
        toast.success(`تم تطبيق خصم ${data.discount_type === 'percentage' ? data.discount_value + '%' : '$' + data.discount_value}`);
      } else if (data.type === 'gift_card') {
        setAppliedCoupon({
          code: data.code,
          discount_type: 'fixed',
          discount_value: data.usable_amount,
          discount_amount: data.usable_amount,
          is_gift_card: true,
        });
        toast.success(`بطاقة هدايا — رصيد متاح: $${data.balance}`);
      }
    } catch (err) {
      toast.error('حدث خطأ في التحقق من الكود');
    }
  };

  const copyNumber = (num, id) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success('تم نسخ الرقم');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('أدخل اسمك الكامل');
    if (!form.phone.trim()) return toast.error('أدخل رقم هاتفك');
    if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone.trim())) return toast.error('رقم الهاتف غير صحيح - أدخل أرقاماً فقط');
    if (includeShipping && shippingZones.length > 0 && !form.shipping_zone_id) return toast.error('اختر منطقة التوصيل');
    if (form.notes && form.notes.length > 500) return toast.error('الملاحظات طويلة جداً (الحد الأقصى 500 حرف)');
    if (items.length === 0) return toast.error('السلة فارغة');

    setSubmitting(true);

    // مفتاح Idempotency فريد لكل محاولة
    const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const affiliateRef = localStorage.getItem('affiliate_ref') || '';

    try {
      const res = await base44.functions.invoke('process-checkout', {
        customer_name: form.name,
        customer_phone: form.phone,
        address: form.address,
        notes: form.notes,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_zone_id: includeShipping ? form.shipping_zone_id : '',
        payment_method: form.payment,
        coupon_code: appliedCoupon?.code || '',
        gift_card_code: !appliedCoupon ? couponCode.trim() : '',
        use_wallet: form.payment === 'wallet',
        use_loyalty: useLoyaltyPoints,
        affiliate_code: affiliateRef,
        idempotency_key: idempotencyKey,
      });

      const data = res.data;
      if (!data || !data.success) {
        toast.error(data?.error || 'فشل إرسال الطلب. حاول مرة أخرى.');
        setSubmitting(false);
        return;
      }

      // ✅ نجاح فقط — امسح السلة وافتح واتساب
      clearCart();
      if (affiliateRef) localStorage.removeItem('affiliate_ref');
      setAppliedCoupon(null);

      const od = data.order;
      const whatsappNum = data.whatsapp_number || settings?.whatsapp_number || '';
      if (whatsappNum) {
        const itemsList = (od.items || items).map(i => `- ${i.title} × ${i.quantity}`).join('\n');
        const discountLine = od.discount > 0 ? `\nخصم: -${currency.format(od.discount)}` : '';
        const shippingLine = !includeShipping
          ? `\nمنطقة التوصيل: ${selectedZone?.zone_name || 'غير محدد'} — يدفع عند الاستلام`
          : od.shipping_fee > 0 ? `\nرسوم الشحن: +${currency.format(od.shipping_fee)}` : '';
        const walletLine = od.wallet_used > 0 ? `\nمن المحفظة: -${currency.format(od.wallet_used)}` : '';
        const msg = `طلب جديد #${od.order_number}\n\nالاسم: ${form.name}\nالهاتف: ${form.phone}\nالعنوان: ${form.address || 'غير محدد'}\n\n${itemsList}${discountLine}${shippingLine}${walletLine}\n\nالإجمالي: ${currency.format(od.total)}\nطريقة الدفع: ${form.payment || 'غير محدد'}`;
        window.open(`https://wa.me/${whatsappNum.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      toast.success(`تم إرسال طلبك بنجاح! رقم الطلب: ${od.order_number}`);
      navigate(`/order-tracking?order=${od.order_number}`);
    } catch (err) {
      toast.error('حدث خطأ في الاتصال. تحقق من اتصالك وحاول مرة أخرى.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={count} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-2xl mx-auto pb-10">
        <h1 className="font-heading font-bold text-2xl mb-6">إتمام الطلب</h1>

        <div className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
            <h3 className="font-heading font-bold">معلوماتك</h3>
            <Input placeholder="الاسم الكامل *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="رقم الهاتف * (أرقام فقط)" value={form.phone} onChange={e => {
              const val = e.target.value.replace(/[^\d\s\-\+]/g, '');
              setForm(f => ({ ...f, phone: val }));
            }} />
            <Input placeholder="العنوان" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

            {shippingZones.length > 0 && (
              <div className="space-y-3">
                {/* خيار تضمين التوصيل بالفاتورة */}
                {insuranceEnabled && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold">تضمين سعر التوصيل بالفاتورة</p>
                          <p className="text-[11px] text-muted-foreground">أو دفع رسوم التوصيل عند الاستلام</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setIncludeShipping(true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${includeShipping ? 'bg-blue-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
                          <Shield className="w-3 h-3" /> تضمين
                        </button>
                        <button type="button" onClick={() => setIncludeShipping(false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${!includeShipping ? 'bg-blue-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
                          <ShieldOff className="w-3 h-3" /> عند الاستلام
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* التوصيل المجاني */}
                {freeShippingEnabled && freeShippingThreshold > 0 && (
                  <div className={`rounded-xl p-3 border text-center text-xs ${meetsFreeShipping ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-700' : 'bg-secondary/40 border-border text-muted-foreground'}`}>
                    {meetsFreeShipping
                      ? '🎉 رائع! طلبك تجاوز حد التوصيل المجاني — التوصيل مجاني'
                      : `أضف ${currency.format(freeShippingThreshold - total)} للحصول على توصيل مجاني (الحد: ${currency.format(freeShippingThreshold)})`}
                  </div>
                )}

                {/* اختيار منطقة التوصيل */}
                {(includeShipping || !insuranceEnabled) && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> منطقة التوصيل {includeShipping ? '*' : '(اختياري)'}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {shippingZones.map(z => {
                        const active = form.shipping_zone_id === z.id;
                        return (
                          <button
                            type="button"
                            key={z.id}
                            onClick={() => setForm(f => ({ ...f, shipping_zone_id: z.id }))}
                            className={`text-right p-3 rounded-lg border-2 transition-all flex items-center justify-between gap-2 ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{z.zone_name}</p>
                              {z.estimated_hours && <p className="text-[11px] text-muted-foreground">{z.estimated_hours}</p>}
                              {z.estimated_time_text && <p className="text-[10px] text-blue-600">⏱ {z.estimated_time_text}</p>}
                            </div>
                            <div className="text-left shrink-0">
                              {meetsFreeShipping && includeShipping ? (
                                <span className="font-bold text-green-600 text-sm">مجاني</span>
                              ) : (
                                <span className="font-bold text-primary text-sm whitespace-nowrap">{Number(z.delivery_fee).toLocaleString('en-US')} {currency.CURRENCY_LABELS?.[z.currency] || z.currency}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Anchor className="w-3 h-3" /> جميع الشحنات تنطلق من {shippingOrigin}</p>
                  </div>
                )}

                {!includeShipping && (
                  <p className="text-[11px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2">سيتم تحديد رسوم التوصيل ودفعها عند الاستلام حسب منطقتك.</p>
                )}
              </div>
            )}
            <div>
              <Textarea placeholder="ملاحظات (اختياري، حد أقصى 500 حرف)" value={form.notes} onChange={e => {
                if (e.target.value.length <= 500) setForm(f => ({ ...f, notes: e.target.value }));
              }} rows={2} />
              {form.notes && <p className="text-xs text-muted-foreground text-left mt-0.5">{form.notes.length}/500</p>}
            </div>
          </div>

          {/* Wallet Payment */}
          {walletBalance > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
              <h3 className="font-heading font-bold">المحفظة الرقمية</h3>
              <div
                onClick={() => setForm(f => ({ ...f, payment: 'wallet' }))}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${form.payment === 'wallet' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">الدفع من المحفظة</p>
                    <p className="text-xs text-muted-foreground">الرصيد: {currency.convert(walletBalance).toLocaleString('ar-SA')} {currency.CURRENCY_LABELS?.[currency.currency] || currency.currency}</p>
                  </div>
                </div>
                {walletBalance >= finalTotal ? (
                  <span className="text-xs text-green-600 font-bold">يكفي</span>
                ) : (
                  <span className="text-xs text-orange-600">غير كافٍ</span>
                )}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
              <h3 className="font-heading font-bold">طريقة الدفع</h3>
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  onClick={() => setForm(f => ({ ...f, payment: pm.name }))}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${form.payment === pm.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-3">
                    {pm.logo && <img src={pm.logo} alt={pm.name} className="w-8 h-8 object-contain" />}
                    <div>
                      <p className="font-bold text-sm">{pm.name}</p>
                      <p className="text-xs text-muted-foreground">{pm.account_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-muted-foreground">{pm.account_number}</span>
                    <button onClick={(e) => { e.stopPropagation(); copyNumber(pm.account_number, pm.id); }} className="p-1 hover:bg-secondary rounded">
                      {copiedId === pm.id ? <Check className="w-3 h-3 text-orange-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Coupon */}
          <div className="bg-card rounded-xl p-4 border border-border/50 space-y-2">
            <h3 className="font-heading font-bold">كود الخصم</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-600 font-medium">✓ {appliedCoupon.code} — خصم {appliedCoupon.discount_type === 'percentage' ? appliedCoupon.discount_value + '%' : '$' + appliedCoupon.discount_value}</p>
                <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)}>إزالة</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="أدخل كود الخصم" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="flex-1 font-bold tracking-wider" />
                <Button variant="outline" onClick={applyCoupon}>تطبيق</Button>
              </div>
            )}
          </div>

          {/* Loyalty Points */}
          {loyaltyPoints > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm">نقاط الولاء</h3>
                  <p className="text-xs text-muted-foreground">{loyaltyPoints} نقطة متاحة</p>
                </div>
                <button onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${useLoyaltyPoints ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {useLoyaltyPoints ? `خصم ${loyaltyDiscount.toFixed(0)}$` : 'استخدام نقاطي'}
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <h3 className="font-heading font-bold mb-3">ملخص الطلب</h3>
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm py-1">
                <span>{item.title} × {item.quantity}</span>
                <span>{currency.format(item.price * item.quantity)}</span>
              </div>
            ))}
            {appliedCoupon && (
              <div className="flex justify-between text-sm py-1 text-green-600">
                <span>خصم ({appliedCoupon.code})</span>
                <span>-{currency.format(discountAmount)}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-sm py-1 text-green-600">
                <span>خصم نقاط الولاء</span>
                <span>-{currency.format(loyaltyDiscount)}</span>
              </div>
            )}
            {!includeShipping && selectedZone && (
              <div className="flex justify-between text-sm py-1 text-orange-600">
                <span>التوصيل ({selectedZone.zone_name})</span>
                <span>عند الاستلام</span>
              </div>
            )}
            {includeShipping && meetsFreeShipping && selectedZone && (
              <div className="flex justify-between text-sm py-1 text-green-600">
                <span>رسوم الشحن ({selectedZone.zone_name})</span>
                <span>مجاني</span>
              </div>
            )}
            {shippingFee > 0 && includeShipping && !meetsFreeShipping && (
              <div className="flex justify-between text-sm py-1">
                <span>رسوم الشحن {selectedZone ? `(${selectedZone.zone_name})` : ''}</span>
                <span>+{currency.format(shippingFee)}</span>
              </div>
            )}
            <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
              <span>الإجمالي</span>
              <span className="text-primary">{currency.format(finalTotal)}</span>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full h-12 text-base" disabled={submitting}>
            <MessageCircle className="w-5 h-5 ml-2" />
            {submitting ? 'جاري الإرسال...' : 'تأكيد وإرسال عبر واتساب'}
          </Button>
        </div>
      </div>
    </div>
  );
}