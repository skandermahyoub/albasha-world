import { Button } from '@/components/ui/button';
import useCurrency from '@/lib/useCurrency';

export default function WhatsAppOrderBtn({ product, qty = 1, settings }) {
  const number = settings?.whatsapp_number;
  const currency = useCurrency(settings);

  const orderViaWhatsApp = () => {
    if (!number) return;
    const msg = `مرحباً،\nأريد طلب المنتج التالي من ${settings?.store_name || 'متجري'}:\n\nالمنتج: ${product.title}\n${product.brand ? `العلامة: ${product.brand}\n` : ''}السعر: ${currency.format(product.price)}\nالكمية: ${qty}\n\nهل المنتج متاح؟`;
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!number) return null;

  return (
    <div className="flex gap-2">
      <Button
        onClick={orderViaWhatsApp}
        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
        </svg>
        اطلب عبر واتساب
      </Button>
    </div>
  );
}