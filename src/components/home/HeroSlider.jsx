import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Pause, Play } from 'lucide-react';

const SLIDE_DURATION = 6000;

function CircularTimer({ progress, paused, onTogglePause }) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress / 100);

  return (
    <button
      onClick={onTogglePause}
      className="relative w-12 h-12 shrink-0 group/timer"
      aria-label={paused ? 'تشغيل' : 'إيقاف'}
    >
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white group-hover/timer:scale-110 transition-transform">
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

export default function HeroSlider({ slides = [] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const now = new Date();
  const activeSlides = slides.filter(s => {
    if (s.is_active === false) return false;
    if (s.start_date && new Date(s.start_date) > now) return false;
    if (s.end_date && new Date(s.end_date) < now) return false;
    return true;
  });
  const getSlideLink = (slide) => {
    if (slide.link_type === 'product' && slide.linked_product_id) return `/product/${slide.linked_product_id}`;
    if (slide.link_type === 'category' && slide.linked_category_id) return `/shop?category=${slide.linked_category_id}`;
    return slide.button_link;
  };
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const goTo = useCallback((i) => {
    setProgress(0);
    startRef.current = null;
    setCurrent(i);
  }, []);

  const next = useCallback(() => {
    if (activeSlides.length <= 1) return;
    goTo((current + 1) % activeSlides.length);
  }, [activeSlides.length, current, goTo]);

  const prev = useCallback(() => {
    if (activeSlides.length <= 1) return;
    goTo((current - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length, current, goTo]);

  useEffect(() => {
    if (activeSlides.length <= 1 || paused) return;

    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        startRef.current = null;
        setProgress(0);
        setCurrent(prev => (prev + 1) % activeSlides.length);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [current, paused, activeSlides.length]);

  if (activeSlides.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">لا توجد شرائح بعد</p>
      </div>
    );
  }

  const slide = activeSlides[current];

  return (
    <div className="relative w-full overflow-hidden group bg-black shadow-2xl aspect-[4/3] sm:aspect-[16/10] md:aspect-[21/9]">

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {/* صورة سينمائية مع زووم بطيء */}
          <motion.img
            src={slide.image}
            alt={slide.title}
            initial={{ scale: 1 }}
            animate={{ scale: 1.12 }}
            transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
            className="w-full h-full object-cover"
          />

          {/* تدرّج سينمائي بهوية المتجر */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          {/* شبكة هندسية خفيفة */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* وهج هندسي سفلي */}
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />

          {/* خطوط زخرفية */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {/* محتوى الشريحة */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 pb-20 md:pb-24">
            {/* رقم الشريحة الكبير خلف العنوان */}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.08, x: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute top-0 right-6 md:right-16 text-[120px] md:text-[200px] font-heading font-black text-white leading-none pointer-events-none select-none"
            >
              {String(current + 1).padStart(2, '0')}
            </motion.span>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '48px' }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="h-1 bg-primary rounded-full mb-4"
            />
            <motion.h2
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-white text-2xl md:text-5xl lg:text-6xl font-heading font-bold mb-3 drop-shadow-2xl max-w-2xl"
            >
              {slide.title}
            </motion.h2>
            {slide.subtitle && (
              <motion.p
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white/80 text-sm md:text-xl mb-5 max-w-xl drop-shadow-lg leading-relaxed"
              >
                {slide.subtitle}
              </motion.p>
            )}
            {slide.button_text && (slide.button_link || slide.linked_product_id || slide.linked_category_id) && (
              <motion.button
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => {
                  const link = getSlideLink(slide);
                  if (link) navigate(link);
                }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-2xl shadow-primary/30 hover:scale-105"
              >
                {slide.button_text}
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* مجموعة التحكم: أرقام + مؤشر دائري + أسهم */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 md:gap-4">
          {/* أرقام الشرائح */}
          <span className="text-white text-sm font-bold tabular-nums tracking-wider drop-shadow-lg">
            <span className="text-primary text-base">{String(current + 1).padStart(2, '0')}</span>
            <span className="text-white/30 mx-1">/</span>
            <span className="text-white/50">{String(activeSlides.length).padStart(2, '0')}</span>
          </span>

          {/* المؤشر الدائري */}
          <CircularTimer
            progress={progress}
            paused={paused}
            onTogglePause={() => setPaused(p => !p)}
          />

          {/* الأسهم */}
          <div className="flex gap-1.5">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary hover:scale-110 transition-all border border-white/10"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary hover:scale-110 transition-all border border-white/10"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}