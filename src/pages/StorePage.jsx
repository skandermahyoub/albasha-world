import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart, useFavorites, useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import ProductCard from '@/components/ProductCard';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Store, Cigarette, Gift, Droplet, Wine, PawPrint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StoreBackgroundEffect from '@/components/home/StoreBackgroundEffect';
import { STORE_DETAILS, getStoreColor } from '@/lib/navLinks';
import { STORE_SECTIONS, resolveStoreKey, getStoreSection } from '@/lib/storeSections';

const STORE_META = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, {
    name: s.nameAr,
    icon: s.icon,
    desc: s.desc,
    color: s.color,
    image: s.heroImage,
  }])
);

export default function StorePage() {
  const { storeKey } = useParams();
  const { isDark, toggle } = useTheme();
  const { addItem, count: cartCount } = useCart();
  const { toggleFav, isFav } = useFavorites();
  const { toggleCompare, isComparing } = useCompare();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [storeConfig, setStoreConfig] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const resolvedKey = resolveStoreKey(storeKey);
  const meta = getStoreSection(storeKey) || STORE_SECTIONS[0];

  // Override store name/icon from theme_config if available
  const themeConfig = settings?.theme_config || {};
  const dynamicStoreName = themeConfig.store_names?.[resolvedKey];
  const dynamicIconName = themeConfig.store_icons?.[resolvedKey];
  const displayMeta = dynamicStoreName ? { ...meta, name: dynamicStoreName, nameAr: dynamicStoreName } : meta;
  const storeTheme = (themeConfig.store_themes || {})[resolvedKey] || {};
  const effectiveColor = storeTheme.primary_color || meta.color;

  useEffect(() => {
    setSelectedCat('all');
    setSearch('');
    setActiveTab('all');
    const load = async () => {
      setLoading(true);
      const [s, p, c, cfgList] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.entities.Product.filter({ store_key: resolvedKey }, '-created_date', 500).catch(() => []),
        base44.entities.Category.filter({ store_key: resolvedKey }, 'sort_order').catch(() => []),
        base44.entities.StoreConfig.filter({ store_key: resolvedKey }).catch(() => []),
      ]);
      setSettings(s[0] || {});
      setStoreConfig(cfgList[0] || null);
      setProducts(p.filter(pr => pr.status === 'active'));
      const parents = c.filter(cat => !cat.parent_id);
      const subs = c.filter(cat => !!cat.parent_id);
      setCategories(parents);
      setSubCategories(subs);
      setLoading(false);
    };
    load();
  }, [storeKey]);

  const TABS = [
    { key: 'all', label: 'الكل' },
    { key: 'bestseller', label: 'الأكثر مبيعاً' },
    { key: 'featured', label: 'المميزة' },
    { key: 'new', label: 'الجديدة' },
  ];

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchTab = activeTab === 'all' ||
      (activeTab === 'bestseller' && p.is_bestseller) ||
      (activeTab === 'featured' && p.is_featured) ||
      (activeTab === 'new' && p.is_new);
    return matchSearch && matchCat && matchTab;
  });

  if (!getStoreSection(storeKey)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">التصنيف غير موجود</p>
        <Link to="/" className="text-primary underline">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      {/* Hero Banner */}
      <div className="relative pt-16 overflow-hidden">
        {storeConfig?.bg_effect_active !== false ? (
          <div className="absolute inset-0">
            <StoreBackgroundEffect
              storeKey={storeKey}
              customImages={storeConfig?.bg_images}
              isActive={true}
            />
          </div>
        ) : (
          <div className="w-full h-48 md:h-64" style={{ background: `linear-gradient(135deg, ${effectiveColor}40, ${effectiveColor}10)` }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${effectiveColor}80, ${effectiveColor}20, var(--background))` }} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-28">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: effectiveColor + '33', border: `2px solid ${effectiveColor}` }}>
            <meta.icon className="w-10 h-10" style={{ color: effectiveColor }} />
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-4xl text-white mb-2">{displayMeta.name}</h1>
          <p className="text-white/70 text-sm md:text-base max-w-lg">{meta.desc}</p>
        </div>
      </div>


      {/* Breadcrumb */}
      <div className="px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            الرئيسية
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          <span className="font-medium" style={{ color: effectiveColor }}>{displayMeta.name}</span>
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto pb-24">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`ابحث في ${displayMeta.name}...`} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>

        {/* Sub-Categories */}
        {subCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSelectedCat('all')}
              className="px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all"
              style={selectedCat === 'all' ? { backgroundColor: effectiveColor, color: '#fff' } : {}}
            >
              الكل
            </button>
            {subCategories.filter(c => c.is_active !== false).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all"
                style={selectedCat === cat.id ? { backgroundColor: effectiveColor, color: '#fff' } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={activeTab === tab.key ? { backgroundColor: effectiveColor, color: '#fff', boxShadow: `0 4px 12px ${effectiveColor}40` } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-4">{filtered.length} منتج</p>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCat + activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
          >
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
                </motion.div>
                </AnimatePresence>

                {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <meta.icon className="w-16 h-16 opacity-30 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد منتجات في هذا التصنيف</p>
          </div>
        )}
      </div>

      <BottomNav settings={settings} />
    </div>
  );
}