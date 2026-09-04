import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Star, Send, Eye, Tag, CalendarDays, Clock, Loader2, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/useCart';
import ShoppableProductCard from '@/components/blog/ShoppableProductCard';
import useCurrency from '@/lib/useCurrency';
import SocialEngagement from '@/components/social/SocialEngagement';

const BLOG_CATEGORIES = {
  perfume: { label: 'عطور', color: 'bg-purple-100 text-purple-700' },
  vape:    { label: 'فيب', color: 'bg-blue-100 text-blue-700' },
  shisha:  { label: 'شيشة', color: 'bg-orange-100 text-orange-700' },
  pets:    { label: 'حيوانات', color: 'bg-orange-100 text-orange-700' },
  boutique:{ label: 'بوتيك', color: 'bg-rose-100 text-rose-700' },
  lifestyle:{ label: 'لايف ستايل', color: 'bg-yellow-100 text-yellow-700' },
  news:    { label: 'أخبار', color: 'bg-sky-100 text-sky-700' },
};

function ReviewForm({ postId, onAdded }) {
  const [form, setForm] = useState({ name: '', comment: '', rating: 5 });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.comment) return toast.error('يرجى ملء جميع الحقول');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('submit-review', { ...form, context: 'blog', content_id: postId });
      if (!res.data?.success) {
        toast.error(res.data?.error || 'تعذر إرسال تعليقك');
        setLoading(false);
        return;
      }
      toast.success('تم إرسال تعليقك وسيظهر بعد المراجعة');
      setForm({ name: '', comment: '', rating: 5 });
      onAdded?.();
    } catch {
      toast.error('تعذر إرسال تعليقك');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3 bg-secondary/30 rounded-2xl p-4 border border-border/40">
      <h4 className="font-heading font-bold text-base">أضف تعليقك</h4>
      <div className="flex gap-2">
        <Input placeholder="اسمك" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="flex-1" />
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(s => (
            <button type="button" key={s} onClick={() => setForm(f => ({ ...f, rating: s }))}>
              <Star className={`w-5 h-5 transition-colors ${s <= form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
            </button>
          ))}
        </div>
      </div>
      <Textarea placeholder="اكتب تعليقك..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} />
      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        إرسال التعليق
      </Button>
    </form>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
            {review.name?.[0] || '؟'}
          </div>
          <div>
            <p className="font-bold text-sm">{review.name}</p>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= (review.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {review.created_date ? new Date(review.created_date).toLocaleDateString('ar-SA') : ''}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
    </div>
  );
}

export default function BlogPostPage() {
  const { id } = useParams();
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [post, setPost] = useState(null);
  const [settings, setSettings] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shoppableProducts, setShoppableProducts] = useState([]);
  const currency = useCurrency(settings);

  const loadReviews = () => base44.functions.invoke('get-public-reviews', { context: 'blog', content_id: id }).then(res => setReviews(res.data?.reviews || [])).catch(() => setReviews([]));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.StoreSettings.list().catch(() => []),
      base44.functions.invoke('get-public-blog-posts', { id, limit: 1 }).then(res => res.data?.posts || []).catch(() => []),
      base44.functions.invoke('get-public-blog-posts', { limit: 20 }).then(res => res.data?.posts || []).catch(() => []),
      base44.functions.invoke('get-public-reviews', { context: 'blog', content_id: id }).then(res => res.data?.reviews || []).catch(() => []),
    ]).then(([s, p, allPosts, r]) => {
      const currentPost = p[0] || null;
      setSettings(s[0] || {});
      setPost(currentPost);
      setReviews(r);
      if (currentPost) {
        let visitorKey = localStorage.getItem('basha_visitor_key');
        if (!visitorKey) {
          visitorKey = `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          localStorage.setItem('basha_visitor_key', visitorKey);
        }
        base44.functions.invoke('record-blog-view', { post_id: currentPost.id, visitor_key: visitorKey }).then(res => {
          if (res.data?.success) setPost(prev => prev ? { ...prev, views: res.data.views } : prev);
        }).catch(() => {});
        setRelatedPosts(allPosts.filter(pp => pp.id !== currentPost.id && pp.status === 'published' && pp.category === currentPost.category).slice(0, 3));
        // جلب منتجات مرتبطة بتصنيف المقال للعرض كـ Shoppable
        if (currentPost.category) {
          base44.entities.Product.filter({ store_key: currentPost.category, status: 'active' }, '-sales_count', 3)
            .then(setShoppableProducts).catch(() => {});
        }
      }
      setLoading(false);
    });
  }, [id]);

  const catMeta = post?.category ? BLOG_CATEGORIES[post.category] : null;
  const readTime = post?.content ? Math.ceil(post.content.split(' ').length / 150) : 0;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">المقال غير موجود</p>
      <Link to="/blog"><Button variant="outline">العودة للمجلة</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      {/* Hero Image */}
      {post.image && (
        <div className="w-full h-64 md:h-96 overflow-hidden relative">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <div className="pt-6 px-4 max-w-3xl mx-auto pb-28">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-5 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للمجلة
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {catMeta && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${catMeta.color}`}>{catMeta.label}</span>}
          {readTime > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {readTime} دقيقة قراءة</span>
          )}
          {post.views > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" /> {post.views} مشاهدة</span>
          )}
          {post.created_date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="w-3 h-3" /> {new Date(post.created_date).toLocaleDateString('ar-SA')}</span>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading font-bold text-2xl md:text-3xl leading-snug"
        >
          {post.title}
        </motion.h1>
        {post.subtitle && <p className="text-lg text-muted-foreground mt-2">{post.subtitle}</p>}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {post.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-secondary px-3 py-1 rounded-full">
                <Tag className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5">
          <SocialEngagement
            contentType="blog"
            contentId={post.id}
            title={post.title}
            shareText={post.subtitle || post.title}
            allowComments={false}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-6" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose prose-sm md:prose-base max-w-none dark:prose-invert
            prose-headings:font-heading prose-headings:text-foreground
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-a:text-primary prose-strong:text-foreground"
        >
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </motion.div>

        {/* Shoppable Products - منتجات تشترى من المقال مباشرة */}
        {shoppableProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="my-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base">منتجات مذكورة في المقال</h3>
                <p className="text-xs text-muted-foreground">أضفها للسلة مباشرة من هنا</p>
              </div>
            </div>
            <div className="space-y-1">
              {shoppableProducts.map(p => (
                <ShoppableProductCard key={p.id} product={p} format={currency.format} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-10">
            <h3 className="font-heading font-bold text-lg mb-4">مقالات ذات صلة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedPosts.map(p => (
                <Link key={p.id} to={`/blog/${p.id}`} className="group block bg-card rounded-xl border border-border/40 overflow-hidden hover:shadow-md transition-all">
                  {p.image && <div className="aspect-video overflow-hidden"><img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                  <div className="p-3">
                    <p className="font-bold text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">{p.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <SocialEngagement
            contentType="blog"
            contentId={post.id}
            title={post.title}
            shareText={post.subtitle || post.title}
          />
        </div>
      </div>

      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}