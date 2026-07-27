import { motion } from 'framer-motion';
import { Crown, Star, Shield, Zap, Gem } from 'lucide-react';

const LEVELS = [
  { key: 'bronze',   label: 'برونزي',  icon: Shield, color: 'from-amber-600 to-amber-400',  min: 0,    max: 200,  bg: 'bg-amber-100',   text: 'text-amber-700'  },
  { key: 'silver',   label: 'فضي',    icon: Star,   color: 'from-gray-400 to-gray-300',     min: 200,  max: 500,  bg: 'bg-gray-100',    text: 'text-gray-600'   },
  { key: 'gold',     label: 'ذهبي',   icon: Zap,    color: 'from-yellow-500 to-yellow-300', min: 500,  max: 1000, bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  { key: 'platinum', label: 'بلاتيني', icon: Gem,    color: 'from-teal-500 to-teal-300',    min: 1000, max: 2000, bg: 'bg-teal-100',    text: 'text-teal-700'   },
  { key: 'vip',      label: 'باشا VIP', icon: Crown,  color: 'from-primary to-amber-400',   min: 2000, max: 9999, bg: 'bg-primary/10',  text: 'text-primary'    },
];

export function getLevelInfo(points) {
  const p = points || 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (p >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

export default function LevelProgressBar({ points = 0 }) {
  const level = getLevelInfo(points);
  const next = LEVELS[level.index + 1];
  const progress = next
    ? Math.min(100, ((points - level.min) / (next.min - level.min)) * 100)
    : 100;
  const remaining = next ? next.min - points : 0;
  const LevelIcon = level.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-background to-secondary rounded-2xl border border-border/50 p-5"
    >
      {/* Level Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg`}>
            <LevelIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">مستواك الحالي</p>
            <p className="font-heading font-bold text-lg">{level.label}</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-3xl font-bold text-primary">{points.toLocaleString('ar')}</p>
          <p className="text-xs text-muted-foreground">نقطة</p>
        </div>
      </div>

      {/* Progress Bar */}
      {next && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{level.label}</span>
            <span>{next.label}</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className={`h-full rounded-full bg-gradient-to-r ${level.color}`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            يتبقى <span className="font-bold text-foreground">{remaining.toLocaleString('ar')} نقطة</span> للوصول إلى مستوى {next.label}
          </p>
        </>
      )}

      {!next && (
        <div className={`text-center text-sm font-bold mt-2 ${level.text}`}>
          وصلت للقمة! أنت باشا VIP
        </div>
      )}

      {/* All Levels */}
      <div className="flex justify-between mt-4 pt-3 border-t border-border/30">
        {LEVELS.map((l, i) => {
          const reached = points >= l.min;
          const LIcon = l.icon;
          return (
            <div key={l.key} className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${reached ? `bg-gradient-to-br ${l.color} shadow` : 'bg-secondary'}`}>
                <LIcon className={`w-3.5 h-3.5 ${reached ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-[9px] font-medium ${reached ? level.text : 'text-muted-foreground'}`}>{l.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}