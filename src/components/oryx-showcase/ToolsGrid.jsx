import { motion } from 'framer-motion';
import { Image, FileText, MessageSquare, ScanLine, Bot, Gift, Bell, Ticket, Trophy, Star } from 'lucide-react';

const TOOLS = [
  { icon: Image, title: 'مولد الصور بالـ AI', color: 'from-purple-500 to-pink-500', desc: 'توليد صور احترافية للمنتجات والإعلانات بالذكاء الاصطناعي' },
  { icon: FileText, title: 'مولد الأوصاف', color: 'from-blue-500 to-cyan-500', desc: 'كتابة أوصاف منتجات جذابة تلقائياً بضغطة زر' },
  { icon: MessageSquare, title: 'المساعد الذكي', color: 'from-green-500 to-emerald-500', desc: 'شات بوت يساعد العملاء في اختيار المنتجات المناسبة' },
  { icon: ScanLine, title: 'ماسح الباركود', color: 'from-orange-500 to-red-500', desc: 'مسح متواصل للباركود للبيع وإدارة المخزون' },
  { icon: Bot, title: 'مساعد واتساب الذكي', color: 'from-green-600 to-teal-500', desc: 'رفع صورة المنتج والعثور على مطابق في المتجر' },
  { icon: Gift, title: 'مستشار الهدايا', color: 'from-rose-500 to-pink-500', desc: 'توصية ذكية بالهدايا حسب الميزانية والمناسبة' },
  { icon: Bell, title: 'نظام الإشعارات', color: 'from-amber-500 to-yellow-500', desc: 'إشعارات فورية للعميل عند تغيير حالة الطلب والعروض' },
  { icon: Ticket, title: 'الكوبونات وبطاقات الهدايا', color: 'from-indigo-500 to-purple-500', desc: 'نظام كوبونات خصم وبطاقات هدايا قابلة للبيع' },
  { icon: Trophy, title: 'المسابقات والاستطلاعات', color: 'from-violet-500 to-fuchsia-500', desc: 'مسابقات تفاعلية واستطلاعات رأي لزيادة التفاعل' },
  { icon: Star, title: 'التقييمات والمراجعات', color: 'from-yellow-500 to-amber-500', desc: 'تقييم بالنجوم للمنتجات والتوصيل مع تعليقات' },
];

export default function ToolsGrid() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold text-primary tracking-wider">الأدوات الذكية</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">أدوات تعمل بالذكاء الاصطناعي</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">أدوات متقدمة توفّر الوقت وتزيد المبيعات تلقائياً</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-sm mb-1.5">{tool.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}