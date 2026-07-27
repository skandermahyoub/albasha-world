import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Play, X, Clapperboard } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function ShortVideosSection() {
  const { settings } = useStoreSettings();
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.VideoGallery.list('sort_order', 10).then(v => {
      setVideos(v.filter(x => x.is_active !== false));
    }).catch(() => []);
  }, []);

  const getYoutubeId = (url) => {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url) => {
    const ytId = getYoutubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    return url;
  };

  if (videos.length === 0) return null;

  return (
    <section className="my-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-primary" /> {settings?.store_name || 'عالم الباشا للتسوق'} شورتس
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {videos.map((v, i) => {
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
              className="relative w-32 md:w-36 aspect-[9/16] shrink-0 snap-center rounded-2xl overflow-hidden cursor-pointer group border border-border/50"
            >
              {thumb ? (
                <img src={thumb} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Play className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 text-primary fill-primary" />
                </div>
              </div>
              <p className="absolute bottom-1.5 right-1.5 left-1.5 text-white text-[11px] font-bold truncate">{v.title}</p>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-sm p-0 bg-black border-0">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {selected && (
            <div className="aspect-[9/16]">
              <iframe
                src={getEmbedUrl(selected.video_url)}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}