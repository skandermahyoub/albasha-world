import { motion } from 'framer-motion';
import { Code2, Palette, Database, Brain, Shield, Smartphone, Cloud, Zap, Radio, Plug, FileImage, GitBranch } from 'lucide-react';

const TECH = [
  { icon: Code2, name: 'React 18 + Vite', desc: 'أحدث إطار عمل لواجهة المستخدم مع تجميع فائق السرعة' },
  { icon: Palette, name: 'Tailwind + shadcn/ui', desc: 'نظام تصميم احترافي قابل للتخصيص بالكامل' },
  { icon: GitBranch, name: 'Framer Motion', desc: 'انتقالات وحركات سلسة عبر التطبيق كله' },
  { icon: Database, name: 'قاعدة بيانات BaaS', desc: 'تخزين سحابي مرن مع ٣٥+ كيان بيانات' },
  { icon: Brain, name: 'ذكاء اصطناعي مدمج', desc: 'نماذج LLM لتوليد الصور والنصوص والتوصيات' },
  { icon: Shield, name: 'مصادقة وأمان', desc: 'نظام مصادقة كامل مع أدوار وصلاحيات' },
  { icon: Smartphone, name: 'PWA تقدّمي', desc: 'تطبيق ويب قابل للتثبيت على iOS و Android' },
  { icon: Cloud, name: 'تخزين سحابي', desc: 'رفع وإدارة الملفات والصور بسحابة آمنة' },
  { icon: Radio, name: 'تحديثات حية', desc: 'اشتراكات Realtime لمزامنة البيانات فورياً' },
  { icon: Plug, name: 'تكاملات OAuth', desc: 'ربط مع ٤٠+ خدمة خارجية (Google, Slack, ...)' },
  { icon: Zap, name: 'React Query', desc: 'إدارة ذكية للبيانات والتخزين المؤقت' },
  { icon: FileImage, name: 'Recharts', desc: 'رسوم بيانية تفاعلية للتقارير والإحصائيات' },
];

export default function TechStack() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold text-primary tracking-wider">البنية التقنية</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">مبني بأحدث التقنيات</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">حزمة تقنية عالمية المستوى تضمن الأداء والقابلية للتوسع</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TECH.map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <tech.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm mb-0.5">{tech.name}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{tech.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}