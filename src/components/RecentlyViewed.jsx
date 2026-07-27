import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'basha_recently_viewed';
const MAX_ITEMS = 6;

export function addToRecentlyViewed(product) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const filtered = existing.filter(p => p.id !== product.id);
  const updated = [{ id: product.id, title: product.title, image: product.image, price: product.price, brand: product.brand }, ...filtered].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export default function RecentlyViewed({ format, currentId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setItems(stored.filter(p => p.id !== currentId));
  }, [currentId]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-bold text-xl">شاهدته مؤخراً</h2>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/product/${item.id}`} className="group block">
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary border border-border/50 mb-2">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=200'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs font-medium truncate">{item.title}</p>
              {item.brand && <p className="text-[10px] text-muted-foreground truncate">{item.brand}</p>}
              {format && item.price && (
                <p className="text-xs text-primary font-bold mt-0.5">{format(item.price)}</p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}