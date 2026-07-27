import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import { useCart } from '@/lib/useCart';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Gallery() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState('الكل');

  useEffect(() => {
    Promise.all([
      base44.entities.StoreSettings.list().catch(() => []),
      base44.entities.Gallery.list('sort_order', 100).catch(() => []),
    ]).then(([s, g]) => {
      setSettings(s[0] || {});
      setPhotos(g.filter(i => i.is_active !== false));
    });
  }, []);

  const categories = ['الكل', ...new Set(photos.map(p => p.category).filter(Boolean))];
  const filtered = activeCategory === 'الكل' ? photos : photos.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-6xl mx-auto pb-20">
        <h1 className="font-heading font-bold text-3xl text-center my-8">معرض الصور</h1>

        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-body transition-colors border ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {filtered.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl"
              onClick={() => setSelected(photo)}
            >
              <img src={photo.image} alt={photo.title || ''} className="w-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300" />
              {photo.title && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 rounded-xl">
                  <p className="text-white text-sm font-bold">{photo.title}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">لا توجد صور بعد</p>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setSelected(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={selected.image} alt={selected.title} className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}