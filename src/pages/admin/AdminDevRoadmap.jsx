import { motion } from 'framer-motion';
import {
  ShieldCheck, ShoppingCart, Package, Users, Calculator, Truck, LayoutDashboard,
  Database, LockKeyhole, ClipboardCheck, Gauge, RefreshCcw, Boxes, CheckCircle2,
  FileClock, Smartphone, ServerCog, BadgeCheck, ExternalLink, Layers3, Wallet,
  ScanBarcode, BookOpen, Bell, GitBranch, CircleDollarSign
} from 'lucide-react';
import { ORYX_LOGO, ORYX_COMPANY } from '@/lib/oryxConfig';

const CORE_MODULES = [
  {
    icon: ShoppingCart,
    title: 'التجارة والطلبات',
    desc: 'كتالوج، سلة، دفع، كوبونات، عروض، باقات، تتبع الطلب ودورة حالات موحدة من الإنشاء حتى التسليم أو الإلغاء أو المرتجع.',
  },
  {
    icon: ScanBarcode,
    title: 'نقطة البيع POS',
    desc: 'كاشير مرتبط بالمنتجات والمخزون والطلبات مع قراءة الباركود وتسجيل الحركة ضمن نفس منظومة التشغيل.',
  },
  {
    icon: Package,
    title: 'المخزون والمشتريات',
    desc: 'مخزون، تنبيهات كميات، حركات مخزون، موردون، أوامر شراء، واسترجاع الكمية آلياً في مسارات الإلغاء والمرتجعات.',
  },
  {
    icon: Users,
    title: 'العملاء وCRM',
    desc: 'ملفات عملاء، تاريخ تعاملات، تصنيف إداري، محافظ، ولاء، تذاكر، رسائل، وتدفقات خدمة ما بعد البيع.',
  },
  {
    icon: Calculator,
    title: 'المالية والربحية',
    desc: 'إيرادات ومصروفات وCOGS وإجمالي الربح وصافي الربح مع حفظ تكلفة المنتج تاريخياً داخل بنود الطلب.',
  },
  {
    icon: Truck,
    title: 'الشحن والمرتجعات',
    desc: 'مناطق شحن، مندوبون، تتبع، مرتجعات، وأرشفة آمنة للطلبات الملغاة مع الحفاظ على السجل المالي.',
  },
  {
    icon: BookOpen,
    title: 'المحتوى والتسويق',
    desc: 'سلايدر، بانرات، عروض، محتوى رئيسية، مدونة، فيديو، مسابقات، استطلاعات، تقييمات ونشرة عملاء من لوحة واحدة.',
  },
  {
    icon: LayoutDashboard,
    title: 'الإدارة والتقارير',
    desc: 'لوحات متابعة تشغيلية ومالية ومؤشرات مخزون وعملاء وسجل نشاط وصلاحيات إدارية متعددة المستويات.',
  },
];

const SECURITY = [
  { icon: LockKeyhole, title: 'مصادقة وهوية', text: 'الدخول يعتمد على حسابات موثقة، مع فصل حساب العميل عن حساب الموظف والإدارة.' },
  { icon: ShieldCheck, title: 'RBAC + RLS', text: 'الصلاحيات لا تعتمد على إخفاء الأزرار فقط؛ الوصول للبيانات والعمليات الحساسة يخضع للتحقق في الخادم وقواعد البيانات.' },
  { icon: ServerCog, title: 'عمليات خادمية موثوقة', text: 'التغييرات الحساسة مثل الطلبات، الأرصدة، العكس المالي والتقييمات تمر عبر Backend يتحقق من الملكية والصلاحية.' },
  { icon: ClipboardCheck, title: 'سجل تدقيق', text: 'العمليات الإدارية المهمة تُسجّل بهوية منفذها، مع منع تحويل سجل التدقيق نفسه إلى أداة قابلة للتلاعب من الواجهة.' },
];

const V5_UPDATES = [
  'تثبيت نموذج صلاحيات الموظفين وربطه فعلياً بالـBackend وقواعد البيانات.',
  'إغلاق تعديل العميل للحقول المالية والإدارية الحساسة في ملفه الشخصي.',
  'توحيد دورة الطلبات والمخزون والولاء والمحفظة والعمولات عند التسليم والإلغاء والمرتجع.',
  'إضافة Cost Snapshot تاريخي لكل بند طلب وحساب COGS وإجمالي وصافي الربح.',
  'توحيد نقطة البيع POS مع المخزون والسجل المالي بدل مسار منفصل.',
  'تحويل الكتالوج والبحث والإدارة إلى Pagination واستعلامات Server-side قابلة للتوسع.',
  'حماية المنتجات غير المنشورة والحقول الإدارية من القراءة العامة.',
  'استكمال الاشتراكات الدورية من جهة العميل والإدارة مع تحقق ملكية خادمي.',
  'تنظيف بيانات القالب والاختبارات والمحتوى التسويقي الوهمي من التشغيل الفعلي.',
  'إزالة الاعتماد على Gemini وR2 من نواة النظام؛ الوظائف الأساسية لا تحتاج مفاتيح خارجية.',
  'الإبقاء على رفع الصور داخل التطبيق مع خيار الرابط المباشر دون ربط النواة بمنصة تخزين خارجية خاصة.',
  'تحديث الهوية والـPWA والـSEO وإزالة آثار القالب القديم بالكامل من الواجهة التشغيلية.',
];

const OPERATING_MODEL = [
  { icon: Layers3, label: 'نموذج النشر', value: 'نسخة مستقلة مخصصة لكل متجر' },
  { icon: Database, label: 'البيانات', value: 'قاعدة تشغيل مستقلة داخل النسخة' },
  { icon: RefreshCcw, label: 'الاستعادة', value: 'Checkpoints قبل التغييرات الجوهرية' },
  { icon: Smartphone, label: 'الواجهة', value: 'Responsive + PWA + تجربة موبايل' },
  { icon: Gauge, label: 'قابلية التوسع', value: 'Pagination واستعلامات خادمية للكتالوج' },
  { icon: GitBranch, label: 'دورة التطوير', value: 'إصدارات منشورة ومراحل تثبيت واضحة' },
];

const DATA_FLOW = [
  { step: '01', title: 'واجهة العميل', text: 'تصفح، بحث، سلة، حساب، طلب، تقييم ومتابعة.' },
  { step: '02', title: 'التحقق الخادمي', text: 'فحص المنتج والسعر والمخزون والملكية والصلاحيات قبل تنفيذ العمليات الحساسة.' },
  { step: '03', title: 'طبقة البيانات', text: 'حفظ الطلبات والعملاء والمخزون والقيود مع قواعد وصول محددة.' },
  { step: '04', title: 'الإدارة', text: 'تشغيل المتجر من لوحة موحدة بصلاحيات منفصلة للعرض والإضافة والتعديل والحذف.' },
  { step: '05', title: 'التدقيق والتقارير', text: 'سجل نشاط ومؤشرات مالية وتشغيلية مبنية على البيانات الفعلية.' },
];

export default function AdminDevRoadmap() {
  return (
    <div className="bg-background min-h-screen -m-4 md:-m-6" dir="rtl">
      <section className="relative overflow-hidden px-4 pt-16 pb-14 border-b border-border/50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.035]" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="bg-white rounded-2xl p-3 border border-border shadow-sm mb-6">
              <img src={ORYX_LOGO} alt="ORYX" className="h-16 md:h-20 w-auto object-contain" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-bold mb-5">
              <BadgeCheck className="w-4 h-4" /> ORYX COMMERCE SYSTEM — VERSION 5.0
            </div>
            <h1 className="font-heading font-black text-4xl md:text-6xl mb-4">نظام أوريكس V5</h1>
            <p className="max-w-3xl text-muted-foreground text-base md:text-lg leading-relaxed">
              منظومة تشغيل تجارة إلكترونية متكاملة تجمع المتجر، الطلبات، نقطة البيع، المخزون، العملاء، المالية، المحتوى، الشحن وخدمة ما بعد البيع في بنية إدارية واحدة قابلة للتخصيص والتوسع.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mt-8">
              {[
                ['الإصدار', '5.0'],
                ['الحالة', 'منشور'],
                ['النشر', 'نسخة مستقلة'],
                ['النواة', 'بدون Gemini / R2'],
              ].map(([label, value]) => (
                <div key={label} className="bg-card border border-border/60 rounded-2xl p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                  <p className="font-heading font-bold text-sm md:text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-bold text-primary mb-2">CORE OPERATIONS</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl">الوحدات التشغيلية الأساسية</h2>
            <p className="text-sm text-muted-foreground mt-2">هذه الوحدات مرتبطة ببيانات وتشغيل فعلي داخل النظام وليست نماذج عرض مستقلة.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CORE_MODULES.map((item, i) => (
              <motion.article key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className="bg-card border border-border/60 rounded-2xl p-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><item.icon className="w-5 h-5 text-primary" /></div>
                <h3 className="font-heading font-bold mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-secondary/25 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold text-primary mb-2">SECURITY & GOVERNANCE</p>
            <h2 className="font-heading font-black text-3xl md:text-4xl">الأمان ليس طبقة واجهة</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">يعتمد V5 على التحقق من الهوية والصلاحيات في طبقة التشغيل والبيانات، لا على إظهار وإخفاء الأزرار فقط.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SECURITY.map(item => (
              <div key={item.title} className="bg-background border border-border/60 rounded-2xl p-5">
                <item.icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-bold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-8">
          <div>
            <p className="text-xs font-bold text-primary mb-2">DATA FLOW</p>
            <h2 className="font-heading font-black text-3xl mb-6">كيف تتحرك العملية داخل النظام</h2>
            <div className="space-y-3">
              {DATA_FLOW.map(item => (
                <div key={item.step} className="flex gap-4 bg-card border border-border/60 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shrink-0">{item.step}</div>
                  <div><h3 className="font-bold text-sm mb-1">{item.title}</h3><p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-primary mb-2">OPERATING MODEL</p>
            <h2 className="font-heading font-black text-3xl mb-6">نموذج التشغيل</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {OPERATING_MODEL.map(item => (
                <div key={item.label} className="bg-card border border-border/60 rounded-2xl p-4">
                  <item.icon className="w-5 h-5 text-primary mb-3" />
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 bg-secondary/25 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><FileClock className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-xs font-bold text-primary mb-1">V5 RELEASE PROFILE</p>
              <h2 className="font-heading font-black text-3xl md:text-4xl">ما الذي يميز الإصدار الخامس</h2>
              <p className="text-sm text-muted-foreground mt-2">التحديثات أدناه مبنية على تغييرات فعلية نُفذت في هذه النسخة، وليست خارطة وعود مستقبلية.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {V5_UPDATES.map(item => (
              <div key={item} className="flex gap-3 bg-background border border-border/60 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card border border-border/60 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5"><Boxes className="w-6 h-6 text-primary" /><h2 className="font-heading font-black text-2xl">ملكية وتشغيل النسخة</h2></div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><p className="font-bold mb-1">نسخة مستقلة</p><p className="text-muted-foreground text-xs leading-relaxed">كل متجر يحصل على نسخة قابلة للتخصيص ببياناته وهويته وإعداداته، وليس مساحة مشتركة مع متاجر أخرى داخل واجهة واحدة.</p></div>
              <div><p className="font-bold mb-1">إدارة كاملة للمحتوى</p><p className="text-muted-foreground text-xs leading-relaxed">المنتجات والأقسام والصفحة الرئيسية والعروض والمقالات والتواصل قابلة للإدارة من داخل لوحة التحكم.</p></div>
              <div><p className="font-bold mb-1">أثر مالي قابل للتدقيق</p><p className="text-muted-foreground text-xs leading-relaxed">المبيعات والمرتجعات والتكلفة والمصروفات لا تُعامل كأرقام تجميلية؛ ترتبط بمسارات الطلب والمخزون والسجل.</p></div>
              <div><p className="font-bold mb-1">قابلية التطوير</p><p className="text-muted-foreground text-xs leading-relaxed">البنية مصممة لإضافة وحدات أو تخصيص قطاعات لاحقاً دون إعادة بناء المتجر من الصفر.</p></div>
            </div>
          </div>
          <div className="bg-primary text-primary-foreground rounded-3xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <ShieldCheck className="w-8 h-8 mb-5" />
              <h2 className="font-heading font-black text-2xl mb-3">ORYX V5</h2>
              <p className="text-sm opacity-80 leading-relaxed">نسخة تشغيل مستقرة مبنية على فصل واضح بين واجهة العميل، الإدارة، الصلاحيات، العمليات الخادمية والبيانات.</p>
            </div>
            <a href="https://oryx.business" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
              {ORYX_COMPANY} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="px-4 py-10 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          <div className="flex items-center gap-3">
            <img src={ORYX_LOGO} alt="ORYX" className="h-10 w-auto object-contain bg-white rounded-lg p-1 border" />
            <div><p className="font-bold text-sm">{ORYX_COMPANY}</p><p className="text-[11px] text-muted-foreground">Business Transformation & Intelligent Systems</p></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> مالية مترابطة</span>
            <span className="inline-flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> تشغيل ومتابعة</span>
            <span className="inline-flex items-center gap-1"><CircleDollarSign className="w-3.5 h-3.5" /> COGS وربحية</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
