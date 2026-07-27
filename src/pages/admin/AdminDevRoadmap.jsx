import HeroShowcase from '@/components/oryx-showcase/HeroShowcase';
import SystemsGrid from '@/components/oryx-showcase/SystemsGrid';
import ToolsGrid from '@/components/oryx-showcase/ToolsGrid';
import PagesExplorer from '@/components/oryx-showcase/PagesExplorer';
import TechStack from '@/components/oryx-showcase/TechStack';
import ClientRating from '@/components/oryx-showcase/ClientRating';
import ActivationHero from '@/components/oryx-showcase/ActivationHero';
import OryxFooter from '@/components/oryx-showcase/OryxFooter';
import ReleaseNotes from '@/components/oryx-showcase/ReleaseNotes';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const HERO_STATS = [
  { value: '٥٠+', label: 'كيان بيانات' },
  { value: '٤٠+', label: 'واجهة إدارة' },
  { value: '٩', label: 'مجالات تشغيل' },
  { value: 'V4.1', label: 'الإصدار الحالي' },
];

const HIGHLIGHTS = [
  'واجهة متجر ديناميكية تعتمد على بيانات الإدارة بدلاً من محتوى تجريبي ثابت',
  'إدارة مستقلة للشرائح والعروض والبنرات والمقالات والتصنيفات ومميزات الرئيسية',
  'كتالوج منتجات قابل للفلترة حسب التصنيف مع السلة والمفضلة والمقارنة',
  'لوحات تشغيل للطلبات والعملاء والمخزون والموردين والمحاسبة والتوصيل',
  'أدوات ذكاء اصطناعي متاحة للمحتوى والصور والمساعدة داخل المتجر',
  'نظام ولاء ومسابقات وتسويق بالعمولة ومحافظ وبطاقات هدايا',
  'إدارة متعددة الأقسام: الشيشة والفيب والبوتيك والعطور واحتياجات الحيوانات',
  'تطبيق ويب قابل للتثبيت مع دعم الشاشات الصغيرة',
];

export default function AdminDevRoadmap() {
  return (
    <div className="bg-background min-h-screen -m-4 md:-m-6" dir="rtl">
      <HeroShowcase stats={HERO_STATS} />

      {/* Highlights bar */}
      <section className="px-4 pb-10">
        <div className="max-w-5xl mx-auto glass-card rounded-3xl p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="font-heading font-black text-2xl md:text-3xl mb-2">أبرز ما أنجزته المنصة</h2>
            <p className="text-sm text-muted-foreground">ملخص واقعي للوظائف المتاحة وخارطة الأولويات في نظام أوريكس V4.1</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/40"
              >
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-body leading-relaxed">{h}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ReleaseNotes />
      <SystemsGrid />
      <ToolsGrid />
      <PagesExplorer />
      <TechStack />

      <ClientRating />

      <ActivationHero />

      <OryxFooter />
    </div>
  );
}