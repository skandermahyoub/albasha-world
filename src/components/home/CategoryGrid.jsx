import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { STORE_SECTIONS, getStoreColor, getStoreIcon } from '@/lib/storeSections';

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const cats = await base44.entities.Category.list('sort_order').catch(() => []);
      // Show only top-level active categories with images
      const visible = cats.filter(c => !c.parent_id && c.is_active !== false);
      setCategories(visible);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section className="my-10 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8 section-luxury">
        <h2 className="font-heading font-bold text-2xl md:text-3xl">تصفّح حسب التصنيف</h2>
        <p className="text-sm text-muted-foreground mt-1">استكشف منتجاتنا حسب التصنيفات المميزة</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {categories.slice(0, 8).map((cat, i) => {
          const storeMeta = STORE_SECTIONS.find(s => s.key === cat.store_key);
          const color = cat.color || storeMeta?.color || getStoreColor(cat.store_key) || '#C2185B';
          const Icon = storeMeta?.icon || getStoreIcon(cat.store_key) || FolderOpen;
          const hasImage = !!cat.image;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={cat.store_key ? `/shop?category=${cat.id}` : '/shop'}
                className="block group"
              >
                <div
                  className="relative rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ borderColor: color + '33', background: `linear-gradient(135deg, ${color}14, ${color}08)` }}
                >
                  <div className="aspect-square overflow-hidden relative">
                    {hasImage ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${color}22, ${color}0A)` }}
                      >
                        <Icon className="w-12 h-12" style={{ color }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {!hasImage && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                      )}
                      <h3 className="text-white font-heading font-bold text-sm truncate">{cat.name}</h3>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <ArrowLeft className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}