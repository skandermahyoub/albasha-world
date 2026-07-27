import { useState, useRef, useEffect } from 'react';
import { Facebook, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function FacebookFeedSection() {
  const { settings } = useStoreSettings();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  const fbUrl = settings?.social_facebook;

  useEffect(() => {
    if (!fbUrl || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '150px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [fbUrl]);

  if (!fbUrl) return null;

  const normalizedUrl = fbUrl.startsWith('http') ? fbUrl : `https://facebook.com/${fbUrl}`;
  const pluginSrc = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(normalizedUrl)}&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  return (
    <section ref={ref} className="my-12 px-4 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-6 section-luxury"
      >
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Facebook className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl md:text-3xl">آخر منشوراتنا</h2>
        </div>
        <p className="text-sm text-muted-foreground">تابعنا على فيسبوك لأحدث الأخبار والعروض الحصرية</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-card rounded-2xl p-3 overflow-hidden"
      >
        {visible ? (
          <iframe
            src={pluginSrc}
            width="100%"
            height="500"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
            frameBorder="0"
            allow="encrypted-media"
            title="Facebook Feed"
            className="w-full rounded-xl min-h-[500px]"
          />
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </motion.div>

      <a
        href={normalizedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 mx-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 w-fit"
      >
        <Facebook className="w-4 h-4" />
        زيارة صفحتنا على فيسبوك
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </section>
  );
}