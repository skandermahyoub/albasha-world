import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoreSettings } from '@/lib/useStoreSettings';

function SmokeParticle({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: style.size,
        height: style.size,
        background: 'radial-gradient(circle, rgba(132,179,46,0.12) 0%, transparent 70%)',
        left: style.x,
        top: style.y,
        filter: 'blur(8px)',
      }}
      animate={{
        y: [0, -120, -180],
        x: [0, style.drift, style.drift * 0.5],
        opacity: [0, 0.6, 0],
        scale: [0.5, 1.8, 2.5],
      }}
      transition={{
        duration: style.duration,
        repeat: Infinity,
        delay: style.delay,
        ease: 'easeOut',
      }}
    />
  );
}

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  size: 40 + Math.random() * 60,
  x: `${10 + Math.random() * 80}%`,
  y: `${60 + Math.random() * 35}%`,
  drift: (Math.random() - 0.5) * 60,
  duration: 5 + Math.random() * 4,
  delay: Math.random() * 4,
}));

export default function AdaptiveNightMode({ isDark }) {
  const { settings } = useStoreSettings();
  const [hour, setHour] = useState(new Date().getHours());
  const [showNightBanner, setShowNightBanner] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setHour(h);
    // أوقات السهرة: من 8 مساءً حتى 2 صباحاً
    setShowNightBanner(h >= 20 || h <= 2);
  }, []);

  const isNightTime = hour >= 20 || hour <= 2;

  if (!isNightTime && !isDark) return null;

  return (
    <>
      {/* Smoke Particles للوضع الليلي */}
      <AnimatePresence>
        {(isNightTime || isDark) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
          >
            {PARTICLES.map(p => (
              <SmokeParticle key={p.id} style={p} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Night Mode Banner */}
      <AnimatePresence>
        {isNightTime && showNightBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ delay: 2, type: 'spring', stiffness: 200 }}
            className="fixed top-20 left-4 right-4 z-40 mx-auto max-w-sm"
          >
            <div className="bg-gradient-to-l from-neutral-900/95 to-primary/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-2xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-heading font-bold text-sm">عروض الليل من {settings?.store_name || 'متجري'}</p>
                <p className="text-xs text-white/70 mt-0.5">تصفح واطلب في أي وقت</p>
              </div>
              <button
                onClick={() => setShowNightBanner(false)}
                className="text-white/60 hover:text-white text-lg leading-none ml-2"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}