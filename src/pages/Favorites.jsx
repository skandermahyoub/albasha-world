import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCart, useFavorites, useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Favorites() {
  const { isDark, toggle } = useTheme();
  const { addItem, count: cartCount } = useCart();
  const { favs, toggleFav, isFav } = useFavorites();
  const { toggleCompare, isComparing } = useCompare();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [s, p] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        favs.length ? base44.functions.invoke('get-public-products', { ids: favs.slice(0, 200), limit: Math.min(favs.length, 200) }).then(res => res.data?.products || []).catch(() => []) : Promise.resolve([]),
      ]);
      setSettings(s[0] || {});
      setProducts(p.filter(pr => favs.includes(pr.id)));
    };
    load();
  }, [favs]);

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <h1 className="font-heading font-bold text-2xl mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" /> المفضلة ({products.length})
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد منتجات في المفضلة</p>
            <Link to="/shop"><Button>تصفح المتجر</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAddCart={addItem} onToggleFav={toggleFav} onToggleCompare={toggleCompare} isFav={isFav(product.id)} isComparing={isComparing(product.id)} format={currency.format} settings={settings} />
            ))}
          </div>
        )}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}