import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, ArrowLeft, Zap } from 'lucide-react';
import { ORYX_LOGO } from '@/lib/oryxConfig';

const FLOATING_ICONS = [
  { Icon: ShoppingBag, delay: 0, x: '10%', y: '20%' },
  { Icon: Sparkles, delay: 0.5, x: '85%', y: '15%' },
  { Icon: Zap, delay: 1, x: '15%', y: '70%' },
  { Icon: ShoppingBag, delay: 1.5, x: '80%', y: '75%' },
];

export default function HeroShowcase({ stats }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 px-4">
      {/* Background grid + glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Floating icons */}
      {FLOATING_ICONS.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block pointer-events-none"
          style={{ left: x, top: y }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, delay, repeat: Infinity }}
        >
          <div className="w-16 h-16 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary/30" />
          </div>
        </motion.div>
      ))}

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center mb-7"
        >
          <div className="bg-white rounded-2xl p-3 shadow-xl shadow-black/10 border border-border/40 inline-block">
            <img src={ORYX_LOGO} alt="Oryx" className="h-16 md:h-20 w-auto object-contain" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">الإصدار V4.1 — منصة تشغيل متجر قابلة للإدارة</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-heading font-black text-5xl md:text-7xl mb-4"
        >
          <span className="text-gradient-luxury">نظام أوريكس V4.1</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground font-body mb-10 max-w-2xl mx-auto"
        >
          منصة تشغيل متجر تجمع المحتوى القابل للإدارة، المنتجات والطلبات والعملاء والمخزون،
          مع أدوات ذكية وتجربة شراء متجاوبة في تطبيق واحد.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 text-center">
              <div className="text-3xl md:text-4xl font-heading font-black text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-body">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 mt-12 text-sm text-muted-foreground"
        >
          <span>اكتشف الإمكانيات الكاملة</span>
          <ArrowLeft className="w-4 h-4 animate-pulse" />
        </motion.div>
      </div>
    </section>
  );
}