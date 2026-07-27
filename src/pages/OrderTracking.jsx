import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, CheckCircle, Truck, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_MAP = {
  pending: { label: 'قيد المراجعة', icon: Clock, color: 'text-yellow-500', step: 1 },
  confirmed: { label: 'تم التأكيد', icon: CheckCircle, color: 'text-blue-500', step: 2 },
  preparing: { label: 'قيد التجهيز', icon: Package, color: 'text-purple-500', step: 3 },
  shipped: { label: 'تم الشحن', icon: Truck, color: 'text-indigo-500', step: 4 },
  delivered: { label: 'تم التسليم', icon: CheckCircle, color: 'text-orange-500', step: 5 },
  cancelled: { label: 'ملغي', icon: Ban, color: 'text-red-500', step: 0 },
};

export default function OrderTracking() {
  const { isDark, toggle } = useTheme();
  const urlParams = new URLSearchParams(window.location.search);
  const [orderNum, setOrderNum] = useState(urlParams.get('order') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    base44.entities.StoreSettings.list().then(s => setSettings(s[0] || {})).catch(() => {});
  }, []);

  const searchOrder = async () => {
    if (!orderNum) { toast.error('أدخل رقم الطلب'); return; }
    if (!phone) { toast.error('أدخل رقم الهاتف للتحقق'); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('track-order', {
        order_number: orderNum,
        customer_phone: phone,
      });
      if (res.data?.success) {
        setOrder(res.data.order);
      } else {
        setOrder(null);
        toast.error(res.data?.error || 'لم يتم العثور على الطلب');
      }
    } catch {
      setOrder(null);
      toast.error('حدث خطأ في البحث');
    }
    setLoading(false);
  };

  const status = order ? STATUS_MAP[order.status] : null;
  const steps = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} />
      <div className="pt-20 px-4 max-w-xl mx-auto">
        <h1 className="font-heading font-bold text-2xl mb-6 text-center">تتبع طلبك</h1>

        <div className="space-y-2 mb-8">
          <Input placeholder="رقم الطلب" value={orderNum} onChange={e => setOrderNum(e.target.value)} />
          <Input placeholder="رقم الهاتف (للتحقق من الملكية)" value={phone} onChange={e => setPhone(e.target.value)} />
          <Button onClick={searchOrder} disabled={loading} className="w-full">
            <Search className="w-4 h-4 ml-2" /> بحث
          </Button>
        </div>

        {loading && <div className="flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}

        {order && status && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <div className="text-center mb-6">
              <span className={`text-3xl ${status.color}`}><status.icon className="w-12 h-12 mx-auto" /></span>
              <h2 className="font-heading font-bold text-xl mt-3">{status.label}</h2>
              <p className="text-sm text-muted-foreground">طلب #{order.order_number}</p>
            </div>

            {/* Progress */}
            {order.status !== 'cancelled' && (
              <div className="flex items-center justify-between mb-8 px-2">
                {steps.map((s, i) => {
                  const stepInfo = STATUS_MAP[s];
                  const active = status.step >= stepInfo.step;
                  return (
                    <div key={s} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        {i + 1}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center">{stepInfo.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Items */}
            <div className="border-t border-border pt-4 space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.title} × {item.quantity}</span>
                  <span>{item.price * item.quantity} {order.currency || 'USD'}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>الإجمالي</span>
                <span className="text-primary">{order.total} {order.currency || 'USD'}</span>
              </div>
            </div>
          </div>
        )}

        {!loading && orderNum && !order && (
          <p className="text-center text-muted-foreground">لم يتم العثور على الطلب</p>
        )}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}