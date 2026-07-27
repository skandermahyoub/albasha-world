import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Flame } from 'lucide-react';

function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1.5 text-white text-xs">
      <Clock className="w-3.5 h-3.5" />
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{timeLeft.hours}h</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{timeLeft.minutes}m</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{timeLeft.seconds}s</span>
    </div>
  );
}

export default function OffersCarousel({ offers = [] }) {
  const scrollRef = useRef(null);
  const activeOffers = offers.filter(o => o.is_active !== false);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  if (activeOffers.length === 0) return null;

  return (
    <section className="my-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-xl flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> العروض المميزة
        </h2>
        <div className="flex gap-1">
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2" style={{ scrollbarWidth: 'none' }}>
        {activeOffers.map((offer, i) => (
          <motion.div
            key={offer.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="w-[70vw] max-w-[300px] md:w-[340px] snap-center flex-shrink-0 rounded-2xl overflow-hidden relative aspect-[4/3] group"
          >
            <img src={offer.image} alt={offer.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {offer.is_flash_sale && (
              <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" /> عرض فلاش
              </div>
            )}

            {offer.discount_percent && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                خصم {offer.discount_percent}%
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4">
              {offer.countdown_end && <CountdownTimer endDate={offer.countdown_end} />}
              <h3 className="text-white font-heading font-bold text-lg mt-2">{offer.title}</h3>
              {offer.subtitle && <p className="text-white/70 text-sm">{offer.subtitle}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}