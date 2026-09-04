import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Blog() {
  const { isDark, toggle } = useTheme();
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.StoreSettings.list().catch(() => []),
      base44.functions.invoke('get-public-blog-posts', { limit: 50 }).then(res => res.data?.posts || []).catch(() => []),
    ]).then(([s, p]) => {
      setSettings(s[0] || {});
      setPosts(p);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-5xl mx-auto">
        <h1 className="font-heading font-bold text-3xl mb-2 text-center">مجلة {settings?.store_name || 'متجري'}</h1>
        <p className="text-center text-muted-foreground mb-8">أحدث المقالات والأخبار في عالم الباشا للتسوق</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/blog/${post.id}`} className="group block bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all">
                <div className="aspect-video overflow-hidden">
                  <img src={post.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=600'} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  {post.category && <span className="text-xs text-primary font-medium">{post.category}</span>}
                  <h2 className="font-heading font-bold text-base mt-1 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h2>
                  {post.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.subtitle}</p>}
                  {post.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {posts.length === 0 && <p className="text-center text-muted-foreground py-20">لا توجد مقالات بعد</p>}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}