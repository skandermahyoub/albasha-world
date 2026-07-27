import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Sparkles, TrendingUp, Flame } from 'lucide-react';
import { useStoreSettings } from '@/lib/useStoreSettings';

import { STORE_SECTIONS, resolveStoreKey } from '@/lib/storeSections';

const STORE_TAGS = {
  shisha: { label: 'شيشة', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300' },
  boutique: { label: 'بوتيك', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  perfume: { label: 'عطور', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  vape: { label: 'فيب', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  pets: { label: 'حيوانات', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
};

const PLACEHOLDER_POSTS = [
  {
    id: 'p1',
    title: 'دليل اختيار المعسل الأنسب لذوقك',
    subtitle: 'تعرف على أشهر نكهات المعسل وكيف تختار الأنسب لجلسة الشيشة المثالية',
    image: 'https://images.unsplash.com/photo-1605020414-f8a7e1b468e6?w=600&h=400&fit=crop',
    category: 'shisha',
    featured: true,
  },
  {
    id: 'p2',
    title: 'أفكار هدايا راقية لكل المناسبات',
    subtitle: 'تشكيلة مختارة من التحف والزهور والهدايا التي تناسب كل الأذواق',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&h=400&fit=crop',
    category: 'boutique',
  },
  {
    id: 'p3',
    title: 'كيف تختار عطرك المثالي؟',
    subtitle: 'نصائح الخبراء لاختيار العطر الأنسب لشخصيتك ومناسباتك',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=400&fit=crop',
    category: 'perfume',
  },
  {
    id: 'p4',
    title: 'مقدمة في عالم الفيب للمبتدئين',
    subtitle: 'كل ما تحتاج معرفته قبل البدء مع أجهزة الفيب والنكهات',
    image: 'https://images.unsplash.com/photo-1532178446324-9471b1ba4c55?w=600&h=400&fit=crop',
    category: 'vape',
  },
];

export default function MagazineSection({ posts = [] }) {
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || 'عالم الباشا للتسوق';
  const published = posts.filter(p => p.status === 'published');
  const displayPosts = published.length >= 3 ? published.slice(0, 4) : PLACEHOLDER_POSTS;

  const [featured, ...rest] = displayPosts;

  return (
    <section className="my-14 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl leading-tight">مجلة {storeName}</h2>
            <p className="text-xs text-muted-foreground">أخبار وتقارير عالم الباشا</p>
          </div>
        </div>
        <Link
          to="/blog"
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:gap-2.5 transition-all"
        >
          كل المقالات <ArrowLeft className="w-4 h-4" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2"
        >
          <Link
            to={featured.id?.startsWith('p') ? '/blog' : `/blog/${featured.id}`}
            className="group relative block rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 aspect-[16/9]"
          >
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
              <Flame className="w-3 h-3" /> الأبرز
            </div>

            {featured.category && STORE_TAGS[resolveStoreKey(featured.category)] && (
              <span className={`absolute top-4 left-4 text-xs px-2.5 py-1 rounded-full font-medium ${STORE_TAGS[resolveStoreKey(featured.category)].color}`}>
                {STORE_TAGS[resolveStoreKey(featured.category)].label}
              </span>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="font-heading font-bold text-white text-xl md:text-2xl leading-tight group-hover:text-primary-foreground transition-colors line-clamp-2">
                {featured.title}
              </h3>
              {featured.subtitle && (
                <p className="text-white/70 text-sm mt-1.5 line-clamp-2">{featured.subtitle}</p>
              )}
            </div>
          </Link>
        </motion.div>

        <div className="flex flex-col gap-4">
          {rest.slice(0, 3).map((post, i) => (
            <motion.div
              key={post.id || i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={post.id?.startsWith('p') ? '/blog' : `/blog/${post.id}`}
                className="group flex gap-3 bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all p-3"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {post.category && STORE_TAGS[resolveStoreKey(post.category)] && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STORE_TAGS[resolveStoreKey(post.category)].color}`}>
                      {STORE_TAGS[resolveStoreKey(post.category)].label}
                    </span>
                  )}
                  <h3 className="font-heading font-bold text-sm mt-1 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.subtitle}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/blog"
              className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl p-4 hover:bg-primary/15 transition-colors group"
            >
              <div>
                <p className="font-heading font-bold text-sm text-primary">اقرأ المزيد</p>
                <p className="text-xs text-muted-foreground mt-0.5">كل المقالات في عالم الباشا</p>
              </div>
              <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowLeft className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-wrap gap-2 mt-6"
      >
        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
          <Sparkles className="w-3 h-3" /> المواضيع:
        </span>
        {Object.entries(STORE_TAGS).map(([key, val]) => (
          <Link
            key={key}
            to="/blog"
            className={`text-xs px-3 py-1 rounded-full font-medium transition-opacity hover:opacity-70 ${val.color}`}
          >
            {val.label}
          </Link>
        ))}
      </motion.div>
    </section>
  );
}