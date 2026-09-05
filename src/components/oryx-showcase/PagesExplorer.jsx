import { motion } from 'framer-motion';
import { Cigarette, Wine, Droplet, PawPrint, ShoppingCart, Package, Heart, GitCompare, Truck, BookOpen, Trophy, Image, Video, ListChecks, Gift, BookMarked, Wallet, UserCog, RotateCcw, TicketCheck, ClipboardList, User } from 'lucide-react';

const STORES = [
  { icon: Cigarette, name: 'الباشا شيشة', color: 'text-rose-600 bg-rose-50' },
  { icon: Wine, name: 'الباشا فيب', color: 'text-pink-600 bg-pink-50' },
  { icon: Gift, name: 'الباشا بوتيك', color: 'text-fuchsia-600 bg-fuchsia-50' },
  { icon: Droplet, name: 'الباشا بيرفيوم', color: 'text-purple-600 bg-purple-50' },
  { icon: PawPrint, name: 'الباشا بيتس', color: 'text-orange-600 bg-orange-50' },
];

const PAGES = [
  { icon: ShoppingCart, name: 'السلة والدفع' },
  { icon: Package, name: 'تفاصيل المنتج' },
  { icon: Heart, name: 'المفضلة' },
  { icon: GitCompare, name: 'المقارنة' },
  { icon: Truck, name: 'تتبع الطلبات' },
  { icon: BookOpen, name: 'المدونة' },
  { icon: Trophy, name: 'الولاء والمكافآت' },
  { icon: Image, name: 'معرض الصور' },
  { icon: Video, name: 'مكتبة الفيديو' },
  { icon: ListChecks, name: 'قوائم الأمنيات' },
  { icon: Gift, name: 'بطاقات الهدايا' },
  { icon: BookMarked, name: 'دليل المستخدم' },
  { icon: Wallet, name: 'المحفظة الرقمية' },
  { icon: UserCog, name: 'لوحة المسوّق' },
  { icon: RotateCcw, name: 'المرتجعات' },
  { icon: TicketCheck, name: 'تذاكر الدعم' },
  { icon: ClipboardList, name: 'الاستطلاعات' },
  { icon: User, name: 'حسابي الشخصي' },
];

export default function PagesExplorer() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* أقسام المتجر */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-xs font-bold text-primary tracking-wider">أقسام المتجر</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">٥ أقسام متخصصة</h2>
          <p className="text-muted-foreground">كل قسم بهويته البصرية وألوانه وأيقوناته المستقلة</p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          {STORES.map((store, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-20 h-20 rounded-3xl ${store.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                <store.icon className="w-9 h-9" />
              </div>
              <span className="text-sm font-bold">{store.name}</span>
            </motion.div>
          ))}
        </div>

        {/* صفحات العميل */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-xs font-bold text-primary tracking-wider">صفحات العميل</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">تجربة شراء وخدمة متكاملة</h2>
          <p className="text-muted-foreground">مسارات حية للتصفح والطلب والحساب والمتابعة وما بعد البيع</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {PAGES.map((page, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <page.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-center">{page.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}