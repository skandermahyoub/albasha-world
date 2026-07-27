import { Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ReferFriendBanner({ settings }) {
  const handleInvite = () => {
    const shareData = {
      title: settings?.store_name || 'متجري',
      text: `تسوق أحدث المنتجات من ${settings?.store_name || 'متجري'} 🛍️`,
      url: window.location.origin,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success('تم نسخ رابط المتجر، شاركه مع أصدقائك!');
    }
  };

  return (
    <section className="my-8 px-4">
      <div className="rounded-2xl bg-primary text-primary-foreground p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 shrink-0 opacity-90" />
          <div>
            <h3 className="font-heading font-bold text-base">ادعُ صديقاً واكسب نقاط ولاء</h3>
            <p className="text-xs opacity-80 mt-0.5">شارك المتجر مع أصدقائك واحصلوا على مكافآت</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleInvite} className="gap-1.5 shrink-0">
          <Share2 className="w-4 h-4" /> شارك
        </Button>
      </div>
    </section>
  );
}