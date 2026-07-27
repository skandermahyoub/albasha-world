import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RotateCcw, Headphones, Award, Zap } from 'lucide-react';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function FeaturesSection() {
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || 'عالم الباشا للتسوق';

  const FEATURES = [
    { icon: ShieldCheck, title: 'منتجات أصلية 100%', desc: 'جميع منتجاتنا أصلية وموثقة بجودة مضمونة', color: 'text-lime-600', bg: 'bg-lime-500/10' },
    { icon: Truck, title: 'توصيل سريع', desc: 'توصيل لجميع مناطق الجمهورية خلال 24-48 ساعة', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { icon: RotateCcw, title: 'إرجاع مضمون', desc: 'سياسة إرجاع سهلة خلال 7 أيام من الاستلام', color: 'text-lime-600', bg: 'bg-lime-500/10' },
    { icon: Headphones, title: 'دعم على مدار الساعة', desc: 'فريق خدمة العملاء متاح 24/7 عبر واتساب', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { icon: Award, title: 'برنامج الولاء VIP', desc: 'اكسب نقاط مع كل عملية شراء واحصل على مزايا حصرية', color: 'text-lime-600', bg: 'bg-lime-500/10' },
    { icon: Zap, title: 'عروض حصرية', desc: `عروض يومية وخصومات لأعضاء ${storeName}`, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  ];

  return (
    <section className="my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">لماذا {storeName}؟</h2>
        <p className="text-muted-foreground text-sm">مميزات تجعل تجربتك استثنائية</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-4 border border-border/50 hover:shadow-lg transition-shadow text-center"
          >
            <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <f.icon className={`w-6 h-6 ${f.color}`} />
            </div>
            <h3 className="font-heading font-bold text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}