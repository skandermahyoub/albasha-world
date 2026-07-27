import { CheckCircle2, ArrowUpRight } from 'lucide-react';

const DELIVERED = [
  'تحويل محتوى الرئيسية إلى بيانات قابلة للإدارة: الشرائح والعروض والبنرات والمنتجات والتصنيفات والمقالات والمميزات.',
  'إضافة إدارة مميزات الصفحة الرئيسية وربط التصنيفات بصفحة المتجر مع فلترة المنتجات.',
  'تنظيم تجربة الإدارة عبر أقسام مستقلة للمحتوى والمنتجات والطلبات والعملاء والتشغيل.',
];

const NEXT = [
  'تفعيل بوابة دفع إلكتروني موحدة قبل اعتماد الدفع المباشر داخل المتجر.',
  'مراجعة مسار الطلب من الدفع حتى التوصيل، وربط حالة الطلب بإشعارات العميل.',
  'إضافة تقارير تشغيلية تعتمد على بيانات المبيعات والمخزون الفعلية بدلاً من مؤشرات ثابتة.',
];

export default function ReleaseNotes() {
  return (
    <section className="px-4 pb-12">
      <div className="max-w-5xl mx-auto grid gap-5 md:grid-cols-2">
        <article className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 text-primary mb-4"><CheckCircle2 className="w-5 h-5" /><span className="text-xs font-bold">تم في V4.1</span></div>
          <h2 className="font-heading font-black text-2xl mb-4">تحديثات مبنية على الحالة الحالية</h2>
          <ul className="space-y-3">{DELIVERED.map((item) => <li key={item} className="flex gap-2 text-sm leading-relaxed"><CheckCircle2 className="w-4 h-4 shrink-0 text-primary mt-1" />{item}</li>)}</ul>
        </article>
        <article className="rounded-3xl p-6 md:p-8 border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-primary mb-4"><ArrowUpRight className="w-5 h-5" /><span className="text-xs font-bold">الأولوية التالية</span></div>
          <h2 className="font-heading font-black text-2xl mb-4">تطويرات مقترحة قبل V4.2</h2>
          <ul className="space-y-3">{NEXT.map((item) => <li key={item} className="flex gap-2 text-sm leading-relaxed"><ArrowUpRight className="w-4 h-4 shrink-0 text-primary mt-1" />{item}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}