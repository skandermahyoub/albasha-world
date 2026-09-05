import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';

export default function SmartRecommendations({ currentProduct, allProducts, onAddCart, onToggleFav, onToggleCompare, isFav, isComparing, format, settings }) {
  if (!currentProduct || !allProducts?.length) return null;

  // Score products by relevance
  const scored = allProducts
    .filter(p => p.id !== currentProduct.id && p.status === 'active')
    .map(p => {
      let score = 0;
      if (p.category_id === currentProduct.category_id) score += 3;
      if (p.brand === currentProduct.brand) score += 2;
      if (p.is_bestseller) score += 1;
      if (p.is_featured) score += 0.5;
      const priceDiff = Math.abs(p.price - currentProduct.price) / currentProduct.price;
      if (priceDiff < 0.3) score += 1;
      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 4);

  if (scored.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-xl">قد يعجبك أيضاً</h2>
        <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">اقتراحات مرتبطة</span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {scored.map(product => (
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
    </section>
  );
}