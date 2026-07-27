import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart, Lock, Loader2 } from 'lucide-react';
import useCurrency from '@/lib/useCurrency';
import { useStoreSettings } from '@/lib/useStoreSettings';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';

export default function SharedWishlist() {
  const { token } = useParams();
  const { settings } = useStoreSettings();
  const currency = useCurrency(settings);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke('get-shared-wishlist', { token });
        const d = res.data;
        if (d.success) {
          setData(d);
        } else {
          setError(d.error || 'القائمة غير متاحة');
        }
      } catch (e) {
        setError('الرابط غير صالح أو انتهت صلاحية القائمة');
      }
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
      <Lock className="w-12 h-12 text-muted-foreground/40" />
      <p className="text-muted-foreground text-center">{error}</p>
      <Link to="/"><Button>العودة إلى المتجر</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={false} toggleTheme={() => {}} settings={settings} />
      <div className="pt-20 pb-28 px-4 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            {data.list_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            قائمة أمنيات مشتركة • {data.items.length} منتج
          </p>
        </motion.div>

        {data.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">لا توجد منتجات متاحة في هذه القائمة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.items.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden border border-border/50 bg-card"
              >
                <Link to={`/product/${p.id}`}>
                  <div className="aspect-square overflow-hidden bg-secondary">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=300'}
                      alt={p.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  {p.available ? (
                    <p className="text-xs text-primary font-bold mt-1">{currency.format(p.price)}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">{p.unavailable_reason || 'لا يوجد'}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}