import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, Instagram, Heart, MessageCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SocialFeedSection() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    base44.entities.SocialPost.list('sort_order', 9).then(p => {
      setPosts(p.filter(x => x.is_active !== false));
    }).catch(() => []);
  }, []);

  const handleShare = async (post) => {
    const url = post.link || window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.content, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ الرابط');
    }
  };

  if (posts.length === 0) return null;

  return (
    <section className="my-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-500" /> آخر منشوراتنا
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl overflow-hidden border border-border/50"
          >
            <div className="relative aspect-square">
              <img src={post.image} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                {post.platform === 'instagram' ? <Instagram className="w-4 h-4 text-pink-500" /> : <Facebook className="w-4 h-4 text-blue-600" />}
              </span>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-bold truncate">{post.title}</p>
              {post.content && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{post.content}</p>}
              <div className="flex items-center justify-between mt-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-[10px]"><Heart className="w-3 h-3" /> {post.likes_count || 0}</span>
                  <span className="flex items-center gap-0.5 text-[10px]"><MessageCircle className="w-3 h-3" /> {post.comments_count || 0}</span>
                </div>
                <button onClick={() => handleShare(post)} className="hover:text-primary transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}