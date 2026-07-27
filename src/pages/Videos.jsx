import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import { useCart } from '@/lib/useCart';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoEngagementPanel from '@/components/video/VideoEngagementPanel';
import ShoppableVideoProducts from '@/components/video/ShoppableVideoProducts';

export default function Videos() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.StoreSettings.list().catch(() => []),
      base44.entities.VideoGallery.list('sort_order').catch(() => []),
      base44.entities.Product.list('-sales_count', 30).catch(() => []),
    ]).then(([s, v, p]) => {
      setSettings(s[0] || {});
      const active = v.filter(x => x.is_active !== false);
      setVideos(active);
      setProducts(p.filter(x => x.status !== 'draft' && x.status !== 'archived'));
      const cats = [...new Set(active.map(x => x.category).filter(Boolean))];
      setCategories(cats);
    });
  }, []);

  const filtered = filterCat === 'all' ? videos : videos.filter(v => v.category === filterCat);

  const getYoutubeId = (url) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url) => {
    const ytId = getYoutubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    return url;
  };

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      <div className="pt-20 px-4 max-w-7xl mx-auto pb-24">
        <h1 className="font-heading font-bold text-3xl mb-2">معرض الفيديو</h1>
        <p className="text-muted-foreground text-sm mb-6">مقاطع فيديو من {settings?.store_name || 'متجري'}</p>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setFilterCat('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              الكل
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${filterCat === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((v, i) => {
            const ytId = getYoutubeId(v.video_url || '');
            const thumb = v.cover_image || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(v)}
                className="bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer group hover:shadow-xl transition-shadow"
              >
                <div className="relative aspect-video">
                  {thumb ? (
                    <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-xl">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  {v.category && (
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {v.category}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-heading font-bold text-sm">{v.title}</h3>
                  {v.description && <p className="text-xs text-muted-foreground mt-1 truncate">{v.description}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Play className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">لا توجد فيديوهات</p>
          </div>
        )}
      </div>

      {/* Video Player */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {selected && (
            <div>
              <div className="aspect-video">
                <iframe
                  src={getEmbedUrl(selected.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
              <div className="p-4">
                <h3 className="text-white font-heading font-bold">{selected.title}</h3>
                {selected.description && <p className="text-white/70 text-sm mt-1">{selected.description}</p>}
              </div>
              <ShoppableVideoProducts video={selected} products={products} />
              <VideoEngagementPanel video={selected} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}