import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { STORE_SECTIONS } from '@/lib/storeSections';

const STORES = STORE_SECTIONS.map(s => ({
  key: s.key, label: s.nameAr, icon: s.icon, color: s.color,
}));

function CategoryCarousel({ store, products, handlers }) {
  const scrollRef = useRef(null);
  const Icon = store.icon;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform hover:scale-105"
            style={{ backgroundColor: store.color + '18', border: `1.5px solid ${store.color}44` }}
          >
            <Icon className="w-5 h-5" style={{ color: store.color }} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg leading-tight">{store.label}</h3>
            <p className="text-xs text-muted-foreground">{products.length} منتج</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all hover:scale-110 shrink-0 border border-border/30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full bg-secondary/60 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all hover:scale-110 shrink-0 border border-border/30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x"
        style={{ scrollbarWidth: 'none', scrollPaddingRight: '1rem' }}
      >
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
            className="shrink-0 w-[150px] sm:w-[170px] md:w-[200px] snap-start"
          >
            <ProductCard
              product={product}
              onAddCart={handlers.onAddCart}
              onToggleFav={handlers.onToggleFav}
              onToggleCompare={handlers.onToggleCompare}
              isFav={handlers.isFav(product.id)}
              isComparing={handlers.isComparing(product.id)}
              format={handlers.format}
              settings={handlers.settings}
            />
          </motion.div>
        ))}

        {/* View All Button Card */}
        <Link
          to={`/store/${store.key}`}
          className="shrink-0 w-[130px] sm:w-[150px] md:w-[170px] snap-start"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="h-full min-h-[240px] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed transition-all hover:shadow-lg"
            style={{ borderColor: store.color + '44', backgroundColor: store.color + '0A' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:scale-110"
              style={{ backgroundColor: store.color }}
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </div>
            <p className="font-heading font-bold text-sm text-center px-2" style={{ color: store.color }}>
              عرض كل
              <br />
              {store.label}
            </p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}

export default function CategoryProductsSection({ products = [], onAddCart, onToggleFav, onToggleCompare, isFav, isComparing, format, settings }) {
  const storesWithProducts = STORES
    .map(s => ({ ...s, items: products.filter(p => p.store_key === s.key).slice(0, 12) }))
    .filter(s => s.items.length > 0);

  if (storesWithProducts.length === 0) return null;

  const handlers = {
    onAddCart,
    onToggleFav,
    onToggleCompare,
    isFav,
    isComparing,
    format,
    settings,
  };

  return (
    <section className="my-8 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8 section-luxury">
        <h2 className="font-heading font-bold text-2xl md:text-3xl">تسوّق حسب القسم</h2>
        <p className="text-sm text-muted-foreground mt-1">اكتشف منتجات كل قسم على حدة</p>
      </div>

      {storesWithProducts.map(store => (
        <CategoryCarousel key={store.key} store={store} products={store.items} handlers={handlers} />
      ))}
    </section>
  );
}