import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';

const HISTORY_KEY = 'basha_viewed_stores';

export default function SmartPersonalization({ products, onAddCart, onToggleFav, onToggleCompare, isFav, isComparing, format, settings }) {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    if (!products?.length) return;

    // Get browsing history
    let viewedStores = [];
    try { viewedStores = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { }

    let scored = products
      .filter(p => p.status === 'active' || !p.status)
      .map(p => {
        let score = 0;
        if (viewedStores.includes(p.store_key)) score += 3;
        if (p.is_bestseller) score += 2;
        if (p.is_featured) score += 1.5;
        if (p.is_new) score += 1;
        score += Math.random() * 0.5; // slight randomness
        return { ...p, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 8);

    setRecommended(scored);
  }, [products]);

  if (recommended.length === 0) return null;

  return (
    <section className="my-10 px-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl">مختارة لك</h2>
            <p className="text-xs text-muted-foreground">بناءً على اهتماماتك</p>
          </div>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> ذكاء اصطناعي
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-x-auto">
        {recommended.slice(0, 4).map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <ProductCard product={p} onAddCart={onAddCart} onToggleFav={onToggleFav} onToggleCompare={onToggleCompare} isFav={isFav?.(p.id)} isComparing={isComparing?.(p.id)} format={format} settings={settings} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}