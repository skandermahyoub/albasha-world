import StoreThemeCustomizer from '@/components/admin/StoreThemeCustomizer';

export default function AdminAITools() {
  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">تخصيص المتجر</h1>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-sm text-muted-foreground leading-relaxed">
        🔧 أدوات توليد الصور والمحتوى بالذكاء الاصطناعي معطّلة مؤقتاً لتقليل استهلاك أرصدة التكاملات. يمكنك رفع الصور يدوياً وكتابة المحتوى بنفسك من الأقسام المخصّصة.
      </div>
      <StoreThemeCustomizer />
    </div>
  );
}