import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { STORES, getStoreColor } from '@/lib/navLinks';

// ─── Subtle UI sound via Web Audio API ───────────────────────────
const playToggleSound = (opening) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Soft tonal sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    if (opening) {
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
    } else {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.22);

    // Subtle air/whoosh layer
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    noise.buffer = buffer;
    const nGain = ctx.createGain();
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = opening ? 1200 : 800;
    nFilter.Q.value = 0.8;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(0.02, now + 0.03);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    noise.start(now);
    noise.stop(now + 0.2);

    setTimeout(() => ctx.close(), 400);
  } catch (e) { /* noop */ }
};

export default function FloatingCategories() {
  const [open, setOpen] = useState(false);
  const audioReady = useRef(false);

  const toggle = useCallback(() => {
    setOpen(prev => {
      playToggleSound(!prev);
      return !prev;
    });
  }, []);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              playToggleSound(false);
              setOpen(false);
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[54]"
          />
        )}
      </AnimatePresence>

      {/* Strip + handle — one connected unit unfolding from right edge */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-[55] flex items-center">
        {/* Unfolding panel */}
        <motion.div
          initial={false}
          animate={{ width: open ? 284 : 0, opacity: open ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="glass-card overflow-hidden rounded-r-3xl relative"
        >
          {/* Ambient glow orbs */}
          <div className="absolute -top-14 -right-6 w-32 h-32 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-2 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative px-4 py-5" style={{ width: 284 }}>
            <p className="text-[10px] font-heading font-bold text-muted-foreground tracking-[0.2em] mb-3 pr-1 uppercase">متاجرنا</p>

            <div className="space-y-0.5">
              {STORES.map((store, i) => {
                const color = store.color || getStoreColor(store.key);
                return (
                  <motion.div
                    key={store.key}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: open ? 1 : 0, x: open ? 0 : 28 }}
                    transition={{ delay: open ? 0.1 + i * 0.05 : 0, duration: 0.3, ease: 'easeOut' }}
                  >
                    <Link
                      to={`/store/${store.key}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/50 transition-all group/item"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: color + '1A', border: `1px solid ${color}33` }}
                      >
                        <store.icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <span className="font-body font-medium text-sm text-foreground">
                        {store.name}
                      </span>
                      <div className="w-1 h-1 rounded-full mr-auto transition-all group-hover/item:w-2 group-hover/item:h-2" style={{ backgroundColor: color }} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="mt-3 block text-center py-2 btn-luxury rounded-xl text-xs font-bold"
            >
              جميع المنتجات
            </Link>
          </div>
        </motion.div>

        {/* Small centered handle button */}
        <button
          onClick={toggle}
          className={`w-7 h-14 bg-gradient-to-l from-primary to-primary/80 rounded-l-xl shadow-lg shadow-primary/40 flex items-center justify-center shrink-0 hover:from-primary hover:to-primary transition-colors relative ${!open ? 'pulse-glow' : ''}`}
          aria-label="المتاجر"
        >
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <ChevronLeft className="w-4 h-4 text-white" />
          </motion.div>
          {/* Subtle vertical sheen */}
          <div className="absolute inset-y-1 right-0.5 w-px bg-white/25 rounded-full" />
        </button>
      </div>
    </>
  );
}