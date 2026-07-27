import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORE_DETAILS } from '@/lib/navLinks';

export default function StoreBackgroundEffect({ storeKey, customImages, isActive = true }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const fallbackImages = STORE_DETAILS[storeKey]?.bgImages || [];
  const images = (customImages && customImages.length > 0) ? customImages : fallbackImages;

  useEffect(() => {
    if (!isActive || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length, isActive]);

  if (!isActive || images.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIdx]}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}