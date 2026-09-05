import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Package, ShoppingCart, Star, Settings,
  Users, BarChart2, Tag, Image, Bell, MessageSquare, Gift, Heart,
  BookOpen, Layers, Trophy, Video, Globe, ArrowRight,
  Smartphone, Zap, Wallet, Percent, Headphones, Truck
} from 'lucide-react';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import useTheme from '@/lib/useTheme';
import { useCart } from '@/lib/useCart';
import { useStoreSettings } from '@/lib/useStoreSettings';

const SECTIONS = [
  {
    icon: Settings,
    color: 'bg-blue-500',
    title: 'إعدادات المتجر',
    path: '/admin/settings',
    desc: 'أول شيء تبدأ به هو تهيئة متجرك',
    steps: [
      'اذهب إلى لوحة التحكم ← إعدادات المتجر',
      'أضف اسم متجرك وشعاره (الـ Logo)',
      'أدخل رقم الواتساب للتواصل مع العملاء',
      'اختر العملة الافتراضية (دولار / ريال سعودي / درهم / ريال يمني)',
      'خصص لون السعر في بطاقات المنتجات',
      'أضف بيانات الفوتر: هاتف، إيميل، عنوان، روابط السوشيال',
    ],
  },
  {
    icon: Package,
    color: 'bg-primary',
    title: 'إدارة المنتجات',
    path: '/admin/products',
    desc: 'أضف منتجاتك وصوّرها بطريقة احترافية',
    steps: [
      'من لوحة التحكم ← المنتجات ← أضف منتجاً جديداً',
      'أضف صورة واضحة وعالية الجودة للمنتج',
      'أدخل اسم المنتج ووصفه التفصيلي والسعر',
      'اختر القسم الذي ينتمي إليه (شيشة / بوتيك / عطور / فيب / حيوانات أليفة)',
      'حدد التصنيف الفرعي المناسب (مثال: معسلات، فحم، عطور رجالية، نكهات فيب)',
      'أدخل المواصفات المناسبة: النكهة، التركتيز، الحجم، الماركة، السعة',
      'حدد حالة المنتج: جديد / مستعمل مثل الجديد / مستعمل جيد / علبة مفتوحة',
      'فعّل "أكثر مبيعاً" أو "جديد" أو "مميز" لإظهاره في أقسام خاصة',
      'أدخل رمز SKU والباركود والكمية المتاحة لتتبع المخزون',
    ],
  },
  {
    icon: Tag,
    color: 'bg-orange-500',
    title: 'التصنيفات',
    path: '/admin/categories',
    desc: 'نظّم منتجاتك في تصنيفات واضحة',
    steps: [
      'أنشئ تصنيفات رئيسية لكل قسم (مثال: معسلات، فحم، عطور رجالية، نكهات فيب)',
      'يمكنك إنشاء تصنيفات فرعية تظهر كفلاتر في صفحة القسم',
      'أضف أيقونة ولون مميز لكل تصنيف',
      'رتّب التصنيفات حسب الأولوية باستخدام حقل الترتيب',
    ],
  },
  {
    icon: Image,
    color: 'bg-violet-500',
    title: 'الشريحة الرئيسية (السلايدر)',
    path: '/admin/slides',
    desc: 'صور عروض تظهر في أعلى الصفحة الرئيسية',
    steps: [
      'أضف صورة جذابة بعرض لا يقل عن 1200 بكسل',
      'أدخل عنواناً رئيسياً وعنواناً فرعياً للشريحة',
      'أضف نص الزر ورابطه (مثال: "تسوق الشيشة" ← /store/shisha)',
      'يمكنك ربط الشريحة بمنتج أو تصنيف محدد',
      'رتّب الشرائح بالأرقام: 1، 2، 3...',
      'فعّل أو أوقف الشريحة بدون حذفها',
    ],
  },
  {
    icon: Bell,
    color: 'bg-amber-500',
    title: 'الشريط النصي والإشعارات',
    path: '/admin/marquee',
    desc: 'أخبر العملاء بعروضك وأخبارك',
    steps: [
      'الشريط النصي: نصوص تتحرك أسفل السلايدر — استخدمها للعروض والتنبيهات',
      'الإشعارات الذكية: تظهر كنوافذ صغيرة تلقائياً أثناء تصفح الموقع',
      'حدد وقت التكرار لكل إشعار (كل كم دقيقة يظهر مجدداً)',
      'أضف أيقونة SVG لكل إشعار',
    ],
  },
  {
    icon: ShoppingCart,
    color: 'bg-orange-500',
    title: 'الطلبات',
    path: '/admin/orders',
    desc: 'تابع طلبات عملائك وحدّث حالتها',
    steps: [
      'الطلبات تأتي تلقائياً عند الشراء من الموقع أو عبر الواتساب',
      'غيّر حالة الطلب: معلق ← مؤكد ← قيد التحضير ← مشحون ← مسلّم',
      'يمكنك فلترة الطلبات حسب الحالة أو البحث باسم العميل',
      'كل طلب يحتوي على بيانات العميل والمنتجات والمبلغ الإجمالي',
    ],
  },
  {
    icon: Users,
    color: 'bg-orange-500',
    title: 'نظام CRM (إدارة العملاء)',
    path: '/admin/crm',
    desc: 'احفظ بيانات عملائك وتواصل معهم',
    steps: [
      'كل عميل يسجل له سجل خاص يحتوي على تاريخ مشترياته',
      'صنّف عملاءك: برونزي / فضي / ذهبي / بلاتيني / باشا VIP حسب إجمالي الإنفاق',
      'أضف ملاحظات خاصة بكل عميل يراها الموظفون',
      'الوسوم (Tags): ضع وسوماً مثل "عميل دائم" أو "يبحث عن عطور" للبحث السريع',
    ],
  },
  {
    icon: Star,
    color: 'bg-yellow-500',
    title: 'آراء العملاء والتقييمات',
    path: '/admin/reviews',
    desc: 'أدر تقييمات عملائك بشكل احترافي',
    steps: [
      'تقييمات المتجر العامة: تظهر في الصفحة الرئيسية بعد موافقتك',
      'تقييمات المنتجات: تظهر في صفحة كل منتج',
      'وافق على التقييمات الجيدة وارفض غير المناسبة',
      'التقييمات تُحسّن ثقة العملاء الجدد وتزيد المبيعات',
    ],
  },
  {
    icon: Gift,
    color: 'bg-pink-500',
    title: 'بطاقات الهدايا',
    path: '/admin/gift-cards',
    desc: 'أنشئ بطاقات هدايا لعملائك',
    steps: [
      'أنشئ بطاقة هدية بقيمة محددة ورسالة مخصصة للمستلم',
      'أرسل كود البطاقة (بصيغة BASHA-XXXXXX) للعميل عبر الواتساب أو الإيميل',
      'تتبع استخدام كل بطاقة: نشطة / مستخدمة / منتهية الصلاحية',
      'استخدمها كمكافآت للعملاء VIP أو عروض الأعياد',
    ],
  },
  {
    icon: BarChart2,
    color: 'bg-indigo-500',
    title: 'نقاط الولاء',
    path: '/loyalty',
    desc: 'برنامج مكافآت يشجع العملاء على العودة',
    steps: [
      'كل عملية شراء تكسب العميل نقاطاً تلقائياً',
      'المستويات: برونزي (0-199) ← فضي (200-499) ← ذهبي (500-999) ← بلاتيني (1000-1999) ← باشا VIP (2000+)',
      'العميل يرى نقاطه وتاريخها من صفحة "حسابي"',
      'يمكنك إضافة نقاط يدوياً من لوحة التحكم',
    ],
  },
  {
    icon: Layers,
    color: 'bg-teal-500',
    title: 'الباقات والعروض المجمعة',
    path: '/admin/bundles',
    desc: 'ادمج منتجات معاً بسعر خاص',
    steps: [
      'أنشئ باقة تجمع منتجين أو أكثر بسعر أقل من مجموعهم',
      'مثال: معسل + فحم + قصدير بخصم 20%',
      'فعّل "عرض في الرئيسية" لتظهر الباقة في الصفحة الرئيسية',
      'الباقات تزيد متوسط قيمة الطلب بشكل ملحوظ',
    ],
  },
  {
    icon: Trophy,
    color: 'bg-red-500',
    title: 'المسابقات',
    path: '/admin/contests',
    desc: 'نشّط تفاعل عملائك بمسابقات ممتعة',
    steps: [
      'أنشئ مسابقة بعنوان واضح وجائزة مغرية',
      'حدد تاريخ انتهاء المسابقة',
      'أضف صورة جذابة للمسابقة',
      'الإدخالات تُجمع تلقائياً من العملاء المشاركين',
    ],
  },
  {
    icon: BookOpen,
    color: 'bg-cyan-500',
    title: 'المدونة والمجلة',
    path: '/admin/blog',
    desc: 'محتوى يجذب العملاء ويبني الثقة',
    steps: [
      'اكتب مقالات عن المنتجات، نصائح الشراء، ومراجعات الفئات المختلفة',
      'اكتب المحتوى مباشرة وأضف صورة بارزة عبر رابط الصورة',
      'المقالات المنشورة تظهر في قسم "المجلة" في الرئيسية',
    ],
  },
  {
    icon: Globe,
    color: 'bg-slate-500',
    title: 'إعدادات الأقسام الخمسة',
    path: '/admin/store-configs',
    desc: 'خصص كل قسم بشكل مستقل',
    steps: [
      'لكل قسم (شيشة، بوتيك، عطور، فيب، حيوانات أليفة) إعدادات خاصة',
      'رقم واتساب خاص بكل قسم',
      'سلايدر مخصص لكل قسم يظهر في صفحته',
      'تفعيل أو إيقاف تأثيرات الخلفية المتحركة',
      'تخصيص الألوان والشعارات لكل قسم من صفحة "هوية المتجر"',
    ],
  },
  {
    icon: Video,
    color: 'bg-red-600',
    title: 'معرض الصور والفيديو',
    path: '/admin/gallery',
    desc: 'أبهر عملاءك بمحتوى بصري رائع',
    steps: [
      'معرض الصور: أضف صور منتجاتك ومتجرك',
      'معرض الفيديو: أضف روابط يوتيوب لمراجعات المنتجات ودروس الاستخدام',
      'المحتوى البصري يزيد وقت تصفح العميل في الموقع',
      'خصص صورة غلاف لكل فيديو',
    ],
  },
  {
    icon: MessageSquare,
    color: 'bg-orange-600',
    title: 'الرسائل والاستطلاعات',
    path: '/admin/messages',
    desc: 'تواصل مع عملائك وافهم احتياجاتهم',
    steps: [
      'رسائل التواصل: ردّ على استفسارات العملاء من صفحة التواصل',
      'الاستطلاعات: أنشئ استطلاع رأي يظهر تلقائياً كنافذة منبثقة',
      'نتائج الاستطلاع تساعدك في فهم ما يريده عملاؤك',
      'المشتركون: قائمة العملاء الذين أبدوا اهتماماً بأخبارك',
    ],
  },
  {
    icon: Percent,
    color: 'bg-green-500',
    title: 'كوبونات الخصم',
    path: '/admin/coupons',
    desc: 'أنشئ أكواد خصم لزيادة المبيعات',
    steps: [
      'أنشئ كود خصم (نسبة أو مبلغ ثابت) لكل قسم',
      'حدد الحد الأدنى للطلب وأقصى عدد استخدامات',
      'حدد فترة صلاحية الكوبون',
      'استخدم الكوبونات في الحملات التسويقية والمواسم',
    ],
  },
  {
    icon: Truck,
    color: 'bg-indigo-600',
    title: 'التوصيل والمرتجعات',
    path: '/admin/delivery',
    desc: 'أدر عمليات التوصيل والمرتجعات',
    steps: [
      'تابع مناديب التوصيل والطلبات المسلمة',
      'إدارة طلبات الإرجاع والاستبدال',
      'حدد مناطق التوصيل والرسوم',
    ],
  },
];

function Section({ section, index }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-right hover:bg-accent/30 transition-colors"
      >
        <div className={`w-10 h-10 ${section.color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-base">{section.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{section.desc}</p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <ol className="space-y-2">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <Link
            to={section.path}
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline font-medium"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            انتقل إلى {section.title}
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export default function UserGuide() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const { settings } = useStoreSettings();

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 pb-28 px-4 max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2">دليل إدارة متجرك</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
            مرحباً بك يا صاحب المتجر! هذا الدليل يشرح لك كيف تدير كل جزء من تطبيق {settings?.store_name || 'عالم الباشا للتسوق'} بطريقة بسيطة وواضحة.
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6"
        >
          <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            من أين تبدأ؟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { num: '1', text: 'أكمل إعدادات المتجر أولاً', path: '/admin/settings' },
              { num: '2', text: 'أضف تصنيفاتك ثم منتجاتك', path: '/admin/products' },
              { num: '3', text: 'خصص السلايدر والعروض', path: '/admin/slides' },
            ].map(item => (
              <Link key={item.num} to={item.path} className="flex items-center gap-3 bg-background rounded-xl p-3 hover:border-primary border border-border transition-colors">
                <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">{item.num}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <Section key={section.title} section={section} index={i} />
          ))}
        </div>

        {/* Admin Link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            <Settings className="w-4 h-4" />
            افتح لوحة التحكم
          </Link>
        </motion.div>
      </div>
      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}