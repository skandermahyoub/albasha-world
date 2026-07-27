import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Trophy, ThumbsUp, Share2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function Contests() {
  const { isDark, toggle } = useTheme();
  const { settings } = useStoreSettings();
  const [contests, setContests] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Contest.list('-created_date').catch(() => []),
      base44.entities.ContestEntry.filter({ status: 'approved' }, '-votes', 50).catch(() => []),
    ]).then(([c, e]) => {
      setContests(c);
      setEntries(e);
      if (c.length > 0) setSelectedContest(c[0]);
    });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContest) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.ContestEntry.create({
      contest_id: selectedContest.id,
      user_email: user?.email || '',
      user_name: user?.full_name || 'مجهول',
      image: file_url,
      caption,
      status: 'pending',
    });
    toast.success('تم رفع صورتك! سيتم مراجعتها');
    setCaption('');
    setUploading(false);
  };

  const handleShare = async (entry) => {
    const shareUrl = `${window.location.origin}/contests`;
    const shareText = `شاهد مشاركتي في مسابقة ${settings?.store_name || 'متجري'}! 🏆`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `مسابقة ${settings?.store_name || 'متجري'}`, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      }
      // مكافأة نقاط عند المشاركة
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        const lp = await base44.entities.LoyaltyPoints.filter({ user_email: user.email }).catch(() => []);
        if (lp[0]) {
          await base44.entities.LoyaltyPoints.update(lp[0].id, { points: (lp[0].points || 0) + 25 });
        } else {
          await base44.entities.LoyaltyPoints.create({ user_email: user.email, points: 25 });
        }
        toast.success('🎉 ربحت 25 نقطة ولاء على المشاركة!');
      } else {
        toast.success('تمت المشاركة! سجل دخولك لربح نقاط الولاء');
      }
    } catch {
      // المستخدم ألغى المشاركة
    }
  };

  const contestEntries = entries.filter(e => e.contest_id === selectedContest?.id);

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-5xl mx-auto pb-10">
        <h1 className="font-heading font-bold text-3xl text-center mb-2 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-primary" /> المسابقات
        </h1>
        <p className="text-center text-muted-foreground mb-4">شارك صورك الفنية وافز بنقاط ولاء!</p>

        {/* Gamification Banner */}
        <div className="bg-gradient-to-l from-primary/10 to-purple-500/5 border border-primary/20 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">اربح نقاط الولاء!</p>
            <p className="text-xs text-muted-foreground">+50 نقطة عند رفع صورة • +25 نقطة عند مشاركة مشاركتك مع أصدقائك</p>
          </div>
        </div>

        {/* Contest Selector */}
        {contests.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-6" style={{ scrollbarWidth: 'none' }}>
            {contests.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedContest(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all ${selectedContest?.id === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {selectedContest && (
          <>
            {selectedContest.image && (
              <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                <img src={selectedContest.image} alt={selectedContest.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Upload */}
            <div className="bg-card rounded-2xl p-6 border border-border/50 mb-8">
              <h3 className="font-heading font-bold text-lg mb-3">شارك في المسابقة</h3>
              <Textarea placeholder="وصف صورتك..." value={caption} onChange={e => setCaption(e.target.value)} rows={2} className="mb-3" />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <Button disabled={uploading} asChild>
                  <span>
                    <Camera className="w-4 h-4 ml-2" /> {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                  </span>
                </Button>
              </label>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {contestEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl overflow-hidden border border-border/50"
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={entry.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold">{entry.user_name}</p>
                    {entry.caption && <p className="text-xs text-muted-foreground mt-1">{entry.caption}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-primary text-sm">
                        <ThumbsUp className="w-3.5 h-3.5" /> {entry.votes}
                      </div>
                      <button
                        onClick={() => handleShare(entry)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> شارك +25
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {contests.length === 0 && <p className="text-center text-muted-foreground py-20">لا توجد مسابقات حالياً</p>}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}