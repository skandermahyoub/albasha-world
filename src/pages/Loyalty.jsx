import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { Star, Gift, ShoppingCart, Eye, Share2, Award } from 'lucide-react';

export default function Loyalty() {
  const { isDark, toggle } = useTheme();
  const [points, setPoints] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, user] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
      ]);
      setSettings(s[0] || {});
      if (user) {
        const pts = await base44.entities.LoyaltyPoints.filter({ user_email: user.email }).catch(() => []);
        setPoints(pts[0] || { points: 0, total_earned: 0, total_spent: 0, history: [] });
      }
      setLoading(false);
    };
    load();
  }, []);

  const tiers = [
    { name: 'برونزي', min: 0, max: 499, color: 'from-orange-600 to-orange-800' },
    { name: 'فضي', min: 500, max: 1499, color: 'from-gray-400 to-gray-600' },
    { name: 'ذهبي', min: 1500, max: 3999, color: 'from-yellow-400 to-yellow-600' },
    { name: 'بلاتيني', min: 4000, max: 9999, color: 'from-purple-400 to-purple-700' },
    { name: 'ماسي', min: 10000, max: Infinity, color: 'from-cyan-300 to-blue-600' },
  ];

  const currentTier = tiers.find(t => (points?.total_earned || 0) >= t.min && (points?.total_earned || 0) <= t.max) || tiers[0];

  const earningWays = [
    { icon: Eye, label: 'زيارة يومية', points: '+5 نقاط' },
    { icon: ShoppingCart, label: 'كل عملية شراء', points: '+10% من قيمة الطلب' },
    { icon: Star, label: 'كتابة تقييم', points: '+15 نقطة' },
    { icon: Share2, label: 'مشاركة منتج', points: '+10 نقاط' },
    { icon: Gift, label: 'دعوة صديق', points: '+50 نقطة' },
    { icon: Award, label: 'فوز بمسابقة', points: 'حتى 500 نقطة' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} />
      <div className="pt-20 px-4 max-w-2xl mx-auto pb-10">
        <h1 className="font-heading font-bold text-3xl text-center mb-2">نقاط الولاء</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">اجمع النقاط واستمتع بالمكافآت</p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Points Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-gradient-to-br ${currentTier.color} rounded-2xl p-6 text-white mb-8 shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm opacity-80">المستوى</span>
                <span className="font-heading font-bold text-lg">{currentTier.name}</span>
              </div>
              <div className="text-center py-4">
                <span className="text-5xl font-heading font-bold">{points?.points || 0}</span>
                <p className="text-sm opacity-80 mt-1">نقطة متاحة</p>
              </div>
              <div className="flex justify-between text-xs opacity-70">
                <span>مكتسب: {points?.total_earned || 0}</span>
                <span>مستخدم: {points?.total_spent || 0}</span>
              </div>
            </motion.div>

            {/* How to Earn */}
            <h2 className="font-heading font-bold text-xl mb-4">كيف تكسب النقاط؟</h2>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {earningWays.map((way, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl p-4 border border-border/50 text-center"
                >
                  <way.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-bold">{way.label}</p>
                  <p className="text-xs text-primary mt-1">{way.points}</p>
                </motion.div>
              ))}
            </div>

            {/* History */}
            {points?.history?.length > 0 && (
              <>
                <h2 className="font-heading font-bold text-xl mb-4">سجل النقاط</h2>
                <div className="space-y-2">
                  {points.history.map((h, i) => (
                    <div key={i} className="bg-card rounded-lg p-3 border border-border/50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold">{h.description}</p>
                        <p className="text-xs text-muted-foreground">{h.date}</p>
                      </div>
                      <span className={`font-bold text-sm ${h.points > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        {h.points > 0 ? '+' : ''}{h.points}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}