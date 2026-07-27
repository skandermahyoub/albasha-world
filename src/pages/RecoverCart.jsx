import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/useCart';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import useTheme from '@/lib/useTheme';
import useCurrency from '@/lib/useCurrency';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RecoverCart() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const { addItem } = useCart();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recovered, setRecovered] = useState(null);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const currency = useCurrency(settings);

  useEffect(() => {
    const load = async () => {
      try {
        const [s] = await Promise.all([
          base44.entities.StoreSettings.list().catch(() => []),
        ]);
        setSettings(s[0] || {});

        const res = await base44.functions.invoke('recover-cart', {
          recovery_token: token,
        });
        const data = res.data;
        if (!data || data.error) {
          setError(data?.error || 'رابط الاستعادة غير صالح');
          setLoading(false);
          return;
        }
        setRecovered(data);
        setLoading(false);
      } catch (err) {
        setError('رابط الاستعادة غير صالح أو انتهت مدته');
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleAddAll = () => {
    if (!recovered) return;
    const available = recovered.items.filter(i => i.available);
    if (available.length === 0) {
      toast.error('لا توجد منتجات متاحة لإضافتها');
      return;
    }
    available.forEach(item => {
      addItem({
        id: item.product_id,
        title: item.title,
        price: item.price,
        image: item.image,
      }, item.quantity);
    });
    setAdded(true);
    toast.success(`تمت إضافة ${available.length} منتج إلى السلة`);
    setTimeout(() => navigate('/cart'), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-2xl mx-auto pb-10">
        <h1 className="font-heading font-bold text-2xl mb-6">استعادة السلة</h1>

        {error ? (
          <div className="bg-card rounded-xl border border-red-200 p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl mb-2">تعذّر الاستعادة</h2>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button onClick={() => navigate('/shop')}>تصفّح المتجر</Button>
          </div>
        ) : added ? (
          <div className="bg-card rounded-xl border border-green-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl mb-2">تمت الإضافة!</h2>
            <p className="text-muted-foreground text-sm">جاري تحويلك إلى السلة...</p>
          </div>
        ) : recovered ? (
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold">منتجات سلتك ({recovered.items.length})</h3>
              </div>

              {recovered.items.some(i => !i.available) && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 dark:text-amber-400">بعض المنتجات لم تعد متاحة وتم استبعادها</span>
                </div>
              )}

              <div className="space-y-3">
                {recovered.items.map((item, i) => (
                  <div key={i} className={`flex gap-3 items-center p-2 rounded-lg ${item.available ? 'bg-secondary/50' : 'bg-red-50 dark:bg-red-950/20 opacity-60'}`}>
                    <img src={item.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100'} alt={item.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.title}</p>
                      {item.available ? (
                        <p className="text-xs text-primary font-bold">{currency.format(item.price)} × {item.quantity}</p>
                      ) : (
                        <p className="text-xs text-red-600">{item.unavailable_reason || 'غير متاح'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">إجمالي السلة المتاحة</span>
              <span className="font-bold text-lg text-primary">{currency.format(recovered.cart_total)}</span>
            </div>

            <Button onClick={handleAddAll} className="w-full h-12 text-base" disabled={!recovered.items.some(i => i.available)}>
              <ShoppingCart className="w-5 h-5 ml-2" />
              إضافة المتاح إلى السلة
            </Button>
          </div>
        ) : null}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}