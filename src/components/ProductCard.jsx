import { Heart, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProductCardSlider from './product/ProductCardSlider';

export default function ProductCard({ product, onAddCart, onToggleFav, onToggleCompare, isFav, isComparing, format, settings }) {
  const showPrice = settings?.card_show_price !== false;
  const showCart = settings?.card_show_cart !== false;
  const showFav = settings?.card_show_fav !== false;
  const showCompare = settings?.card_show_compare !== false;
  const priceColor = settings?.price_color || '#C2185B';
  const discountActive = product.old_price && product.old_price > product.price && (!product.discount_end_date || new Date(product.discount_end_date) >= new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
    >
      {/* شريط علوي متدرّج يظهر عند المرور */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />

      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-secondary/30">
        <ProductCardSlider product={product} disabled={product.stock != null && product.stock === 0} />
        {/* تدرّج سفلي ناعم */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {product.stock != null && product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">نفدت الكمية</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] px-2.5 py-1 rounded-full font-bold shadow-md">جديد</span>
          )}
          {product.is_bestseller && (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-md">الأكثر مبيعاً</span>
          )}
          {discountActive && (
            <span className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-md">
              -{Math.round((1 - product.price / product.old_price) * 100)}%
            </span>
          )}
          {product.stock != null && product.stock > 0 && product.stock <= 5 && (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-md animate-pulse">
              بقي {product.stock} فقط
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          {showFav && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleFav?.(product.id); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${isFav ? 'bg-red-500 text-white' : 'bg-white/70 text-gray-700 hover:bg-white hover:scale-110'}`}
            >
              <Heart className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
            </button>
          )}
          {showCompare && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleCompare?.(product.id); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${isComparing ? 'bg-primary text-primary-foreground' : 'bg-white/70 text-gray-700 hover:bg-white hover:scale-110'}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3.5">
        {product.brand && <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{product.brand}</p>}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">{product.title}</h3>
        </Link>

        <div className="flex items-center justify-between mt-2.5">
          {showPrice && product.price != null && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base" style={{ color: priceColor }}>
                  {format ? format(product.price) : `${product.price} $`}
                </span>
                {discountActive && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {format ? format(product.old_price) : `${product.old_price}`}
                  </span>
                )}
              </div>
            </div>
          )}
          {showCart && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { if (product.stock == null || product.stock > 0) onAddCart?.(product); }}
              disabled={product.stock != null && product.stock <= 0}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}