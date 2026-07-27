import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function AIDescriptionGenerator({ productName, storeKey, onGenerated }) {
  const { settings } = useStoreSettings();
  const appStoreName = settings?.store_name || 'متجري';
  const [loading, setLoading] = useState(false);

  const storeNames = {
    perfume: 'عطور فاخرة',
    vape: 'فيب إلكتروني',
    shisha: 'شيشة ومعسل',
    pets: 'طعام حيوانات أليفة',
    boutique: 'هدايا وتحف',
  };

  const generate = async () => {
    if (!productName) return toast.error('أدخل اسم المنتج أولاً');
    setLoading(true);
    const storeName = storeNames[storeKey] || 'منتجات فاخرة';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `اكتب وصفاً تسويقياً فاخراً وجذاباً للمنتج "${productName}" من متجر ${storeName} في ${appStoreName}. 
      الوصف يجب أن يكون:
      - باللغة العربية الفصحى المبسطة
      - 3-4 جمل جذابة تحفز على الشراء
      - يذكر المميزات والفوائد
      - أسلوب راقي وفخم يليق بعلامة ${appStoreName}
      - لا تتجاوز 100 كلمة
      أعطني الوصف مباشرة بدون أي مقدمات.`,
    });
    onGenerated(result);
    setLoading(false);
    toast.success('تم توليد الوصف');
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generate}
      disabled={loading}
      className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
      {loading ? 'جاري التوليد...' : 'توليد بالذكاء الاصطناعي'}
    </Button>
  );
}