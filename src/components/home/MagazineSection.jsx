import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function MagazineSection({ posts = [] }) {
  const { settings } = useStoreSettings();
  const items = posts.filter(post => post.status === 'published').slice(0, 4);
  if (!items.length) return null;

  return (
    <section className="my-14 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
          <div><h2 className="font-heading font-bold text-2xl">مجلة {settings?.store_name || 'المتجر'}</h2><p className="text-xs text-muted-foreground">محتوى منشور من لوحة التحكم</p></div>
        </div>
        <Link to="/blog" className="flex items-center gap-1 text-sm text-primary font-medium">كل المقالات <ArrowLeft className="w-4 h-4" /></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((post, index) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
            <Link to={`/blog/${post.id}`} className="group block h-full bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="aspect-[4/3] overflow-hidden bg-secondary">{post.image && <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}</div>
              <div className="p-4">{post.category && <span className="text-xs text-primary font-medium">{post.category}</span>}<h3 className="font-heading font-bold text-base mt-1 line-clamp-2">{post.title}</h3>{post.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.subtitle}</p>}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}