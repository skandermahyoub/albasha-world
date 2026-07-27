import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/useCart';

export default function ShoppableProductCard({ product, format }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-5 mx-auto max-w-sm"
    >
      <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300">
        <div className="flex items-center gap-3 p-3">
          <Link to={`/product/${product.id}`} className="shrink-0">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=120'}
              alt={product.title}
              className="w-20 h-20 rounded-xl object-cover hover:scale-105 transition-transform"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">مذكور في المقال</span>
            </div>
            <Link to={`/product/${product.id}`}>
              <p className="font-bold text-sm leading-snug hover:text-primary transition-colors line-clamp-2">{product.title}</p>
            </Link>
            {product.brand && <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary text-base">
                {format ? format(product.price) : `${product.price} ر.س`}
              </span>
              <div className="flex gap-1.5">
                <Link to={`/product/${product.id}`}>
                  <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </Link>
                <button
                  onClick={handleAdd}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    added ? 'bg-orange-500 text-white scale-110' : 'bg-primary text-white hover:bg-primary/80'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="w-3.5 h-3.5" />
                      </motion.div>
                    ) : (
                      <motion.div key="cart" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}