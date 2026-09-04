import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCart, useFavorites, useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import ProductCard from '@/components/ProductCard';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import AISearch from '@/components/AISearch';
import { revertExpiredDiscounts } from '@/lib/discountUtils';
import { getStores } from '@/lib/navLinks';

export default function Shop() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'all';
  const { isDark, toggle } = useTheme();
  const { addItem, count: cartCount } = useCart();
  const { toggleFav, isFav } = useFavorites();
  const { toggleCompare, isComparing } = useCompare();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const STORES = [{ key: 'all', label: 'الكل', emoji: '🛒' }, ...getStores(settings?.theme_config || {}).map(s => ({ key: s.key, label: s.name, emoji: '🏷️' }))];

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [selectedStore, setSelectedStore] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, p, c] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.entities.Product.list('-created_date', 1000).catch(() => []),
        base44.entities.Category.list('sort_order').catch(() => []),
      ]);
      setSettings(s[0] || {});
      const active = p.filter(pr => pr.status === 'active');
      const reverted = await revertExpiredDiscounts(active);
      setProducts(reverted);
      setCategories(c);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchStore = selectedStore === 'all' || p.store_key === selectedStore;
    return matchSearch && matchCat && matchStore;
  });

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2">جميع المنتجات</h1>
        <p className="text-muted-foreground text-sm mb-6">تسوق منتجات {settings?.store_name || 'عالم الباشا للتسوق'} — شيشة، بوتيك، عطور، فيب، وحيوانات أليفة</p>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <AISearch allProducts={products} format={currency.format} />
        </div>

        {/* Store Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
          {STORES.map(store => (
            <button
              key={store.key}
              onClick={() => { setSelectedStore(store.key); setSelectedCat('all'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${selectedStore === store.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              <span>{store.emoji}</span>
              <span>{store.label}</span>
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSelectedCat('all')} className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${selectedCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            الكل
          </button>
          {categories.filter(c => c.is_active !== false && (selectedStore === 'all' || c.store_key === selectedStore)).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${selectedCat === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-8">
          {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddCart={addItem}
                onToggleFav={toggleFav}
                onToggleCompare={toggleCompare}
                isFav={isFav(product.id)}
                isComparing={isComparing(product.id)}
                format={currency.format}
                settings={settings}
              />
            ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">لا توجد منتجات</p>
        )}
      </div>
      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}