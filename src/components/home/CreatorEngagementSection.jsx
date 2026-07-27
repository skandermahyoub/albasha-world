import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clapperboard, Gift, MessageCircle, Share2, Sparkles } from 'lucide-react';
import SocialEngagement from '@/components/social/SocialEngagement';
import { toast } from 'sonner';

export default function CreatorEngagementSection({ settings }) {
  const shareApp = async () => {
    const title = settings?.store_name || 'متجري';
    const text = `حمّل تطبيق ${title} وتابع العروض والفيديوهات الحصرية.`;
    if (navigator.share) await navigator.share({ title, text, url: window.location.origin }).catch(() => {});
    else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success('تم نسخ رابط التطبيق');
    }
  };

  return (
    <section className="px-4 my-8">
      <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-background p-5 md:p-7">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-5 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
              <Sparkles className="w-4 h-4" /> مجتمع {settings?.store_name || 'المتجر'}
              </span>
              <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">تابع، شارك، وادخل مجتمع جمهور {settings?.store_name || 'المتجر'}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              هنا ستجد فيديوهات حصرية، مراجعات هواتف، عروض مفاجئة، وتعليقات الجمهور داخل التطبيق.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/videos"><Button className="gap-2"><Clapperboard className="w-4 h-4" /> شاهد الفيديوهات</Button></Link>
              <Link to="/contests"><Button variant="outline" className="gap-2"><Gift className="w-4 h-4" /> المسابقات</Button></Link>
              <Button variant="outline" onClick={shareApp} className="gap-2"><Share2 className="w-4 h-4" /> شارك التطبيق</Button>
            </div>
          </div>
          <div className="bg-background/80 rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-bold">رأي الجمهور في التطبيق</h3>
            </div>
            <SocialEngagement contentType="app" contentId="home" title={settings?.store_name || 'متجري'} shareText={`شارك تطبيق ${settings?.store_name || 'متجري'} مع أصدقائك`} compact />
          </div>
        </div>
      </div>
    </section>
  );
}