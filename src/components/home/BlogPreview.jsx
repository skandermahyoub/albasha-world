import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function BlogPreview({ posts = [] }) {
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || 'متجري';
  const published = posts.filter(p => p.status === 'published').slice(0, 3);
  if (published.length === 0) return null;

  return (
    <section className="my-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-2xl">مجلة {storeName}</h2>
        <Link to="/blog" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
          عرض الكل <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {published.map((post, i) => (
          <motion.div
            key={post.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={`/blog/${post.id}`} className="group block bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all">
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=600'}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                {post.category && <span className="text-xs text-primary font-medium">{post.category}</span>}
                <h3 className="font-heading font-bold text-base mt-1 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                {post.subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.subtitle}</p>}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}