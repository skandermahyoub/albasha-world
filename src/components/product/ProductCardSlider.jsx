import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductCardSlider({ product, disabled }) {
  const images = [
    product.image,
    ...(product.images || []),
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(id);
  }, [images.length, paused]);

  if (images.length <= 1) {
    return (
      <img
        src={images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'}
        alt={product.title}
        loading="lazy"
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${disabled ? 'grayscale opacity-60' : ''}`}
      />
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt={product.title}
          loading="lazy"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${disabled ? 'grayscale opacity-60' : ''}`}
        />
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndex(i); }}
            className={`h-1 rounded-full transition-all ${i === index ? 'w-4 bg-white shadow' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
}