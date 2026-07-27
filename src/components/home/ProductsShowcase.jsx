import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../ProductCard';

const TABS = [
  { key: 'bestseller', label: 'الأكثر مبيعاً', filter: p => p.is_bestseller },
  { key: 'featured', label: 'المميزة', filter: p => p.is_featured },
  { key: 'new', label: 'الجديدة', filter: p => p.is_new },
  { key: 'coming', label: 'قادم قريباً', filter: p => p.is_coming_soon },
];

export default function ProductsShowcase({ products = [], onAddCart, onToggleFav, onToggleCompare, isFav, isComparing, format, settings }) {
  const [activeTab, setActiveTab] = useState('bestseller');
  const currentTab = TABS.find(t => t.key === activeTab);
  const filtered = products.filter(p => p.status !== 'draft' && p.status !== 'archived').filter(currentTab?.filter || (() => true));

  return (
    <section className="my-12 px-4">
      {/* Section Header */}
      <div className="text-center mb-8 section-luxury">
        <h2 className="font-heading font-bold text-2xl md:text-3xl">معرض المنتجات</h2>
        <p className="text-sm text-muted-foreground mt-1">تصفّح أحدث وأفضل منتجاتنا</p>
      </div>

      {/* Premium Tabs */}
      <div className="flex justify-center gap-1.5 mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === tab.key
                ? 'text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {filtered.slice(0, 8).map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddCart={onAddCart}
              onToggleFav={onToggleFav}
              onToggleCompare={onToggleCompare}
              isFav={isFav?.(product.id)}
              isComparing={isComparing?.(product.id)}
              format={format}
              settings={settings}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">لا توجد منتجات في هذا التصنيف</p>
      )}
    </section>
  );
}