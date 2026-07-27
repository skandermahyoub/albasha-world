import { motion } from 'framer-motion';
import { ShoppingCart, ReceiptText, Warehouse, Users, Trophy, Megaphone, Landmark, Truck, Cpu } from 'lucide-react';

const SYSTEMS = [
  {
    icon: ShoppingCart,
    gradient: 'from-emerald-500 to-teal-600',
    title: 'نظام التجارة الإلكترونية',
    desc: 'متجر متكامل بـ ٥ أقسام، سلايدر ديناميكي، عروض حصرية، باقات منتجات، ومقارنة ومفضلة',
    features: ['سلة دفع كاملة', 'كوبونات وخصومات', 'مقارنة المنتجات', 'تتبع الطلبات'],
  },
  {
    icon: ReceiptText,
    gradient: 'from-amber-500 to-orange-600',
    title: 'نظام نقاط البيع (POS)',
    desc: 'كاشير متكامل بمسح باركود متواصل، خصومات على الفاتورة، وإدارة ورديات الصندوق',
    features: ['مسح باركود متواصل', 'ورديات الكاشير', 'خصومات الفاتورة', 'طباعة الفواتير'],
  },
  {
    icon: Warehouse,
    gradient: 'from-blue-500 to-indigo-600',
    title: 'نظام إدارة المخزون (ERP)',
    desc: 'تتبع كامل للمخزون، تنبيهات الكميات، حركات المخزون، والموردين وأوامر الشراء',
    features: ['تنبيهات المخزون', 'حركات المخزون', 'الموردين', 'أوامر الشراء'],
  },
  {
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    title: 'نظام إدارة العملاء (CRM)',
    desc: 'قاعدة بيانات عملاء، تقييم إداري، درجات عضوية، تاريخ التفاعلات، ومحفظة رقمية',
    features: ['درجات VIP', 'محفظة رقمية', 'تقييم العملاء', 'سجل التفاعلات'],
  },
  {
    icon: Trophy,
    gradient: 'from-yellow-500 to-amber-600',
    title: 'نظام الولاء والمكافآت',
    desc: 'نقاط ولاء، عجلة حظ، مسابقات، ومستويات عضوية تصاعدية',
    features: ['نقاط الولاء', 'عجلة الحظ', 'المسابقات', 'مستويات العضوية'],
  },
  {
    icon: Megaphone,
    gradient: 'from-rose-500 to-pink-600',
    title: 'نظام التسويق بالعمولة',
    desc: 'برنامج مسوقين بالعمولة، أكواد إحالة، تتبع النقرات والمبيعات وحساب العمولات',
    features: ['أكواد إحالة', 'تتبع العمولات', 'لوحة المسوق', 'روابط الإحالة'],
  },
  {
    icon: Landmark,
    gradient: 'from-cyan-500 to-sky-600',
    title: 'نظام المحاسبة المالية',
    desc: 'إدارة المصروفات، التقارير المالية، صندوق المتجر، وإيرادات الأقسام',
    features: ['إدارة المصروفات', 'التقارير المالية', 'صندوق المتجر', 'إيرادات الأقسام'],
  },
  {
    icon: Truck,
    gradient: 'from-lime-500 to-green-600',
    title: 'نظام التوصيل والمرتجعات',
    desc: 'وكلاء توصيل، تتبع الشحنات، إدارة المرتجعات، وتذاكر الدعم الفني',
    features: ['وكلاء التوصيل', 'تتبع الشحنات', 'المرتجعات', 'تذاكر الدعم'],
  },
  {
    icon: Cpu,
    gradient: 'from-fuchsia-500 to-purple-600',
    title: 'نظام الذكاء الاصطناعي',
    desc: 'توليد صور وأوصاف للمنتجات، ومساعد محادثة داخل المتجر لإرشاد العميل.',
    features: ['توليد الصور', 'توليد الأوصاف', 'مساعد ذكي', 'محتوى مرئي'],
  },
];

export default function SystemsGrid() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold text-primary tracking-wider">الأنظمة المتكاملة</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">٩ أنظمة في تطبيق واحد</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">وحدات تشغيل تغطي رحلة المتجر من المحتوى إلى خدمة العميل.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SYSTEMS.map((sys, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group glass-card rounded-3xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sys.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <sys.icon className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">{sys.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{sys.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {sys.features.map((f, j) => (
                  <span key={j} className="text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-foreground">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}