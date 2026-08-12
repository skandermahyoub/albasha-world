import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import OrderDetailsCard from '@/components/orders/OrderDetailsCard';

export default function OrderTracking() {
  const { isDark, toggle } = useTheme();
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const [orderNum, setOrderNum] = useState(urlParams.get('order') || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    base44.entities.StoreSettings.list().then(items => setSettings(items[0] || {})).catch(() => {});
  }, []);

  const searchOrder = async () => {
    if (!orderNum) return toast.error('أدخل رقم الطلب');
    if (!user && !phone) return toast.error('أدخل رقم الهاتف للتحقق');
    setLoading(true);
    const res = await base44.functions.invoke('track-order', { order_number: orderNum, customer_phone: phone });
    setLoading(false);
    if (!res.data?.success) return toast.error(res.data?.error || 'لم يتم العثور على الطلب');
    setOrder(res.data.order);
  };

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible cartCount={0} isDark={isDark} toggleTheme={toggle} />
      <main className="pt-20 px-4 max-w-xl mx-auto pb-8">
        <h1 className="font-heading font-bold text-2xl mb-6 text-center">{user ? 'تفاصيل طلبك' : 'تتبع طلبك'}</h1>
        <div className="space-y-2 mb-8">
          <Input placeholder="رقم الطلب" value={orderNum} onChange={event => setOrderNum(event.target.value)} />
          {!user && <Input placeholder="رقم الهاتف (للتحقق من الملكية)" value={phone} onChange={event => setPhone(event.target.value)} />}
          <Button onClick={searchOrder} disabled={loading} className="w-full"><Search className="w-4 h-4 ml-2" />{loading ? 'جارٍ البحث...' : 'عرض الطلب'}</Button>
        </div>
        {order && <OrderDetailsCard order={order} />}
      </main>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}