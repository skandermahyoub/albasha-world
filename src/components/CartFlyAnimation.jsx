import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

// نظام Micro-interaction: تأثير "الطيران للسلة" عند الإضافة
let listeners = [];

export function triggerCartFly(sourceRect) {
  listeners.forEach(fn => fn(sourceRect));
}

export default function CartFlyAnimation() {
  const [animations, setAnimations] = useState([]);

  useEffect(() => {
    const handler = (sourceRect) => {
      if (!sourceRect) return;
      const id = Date.now() + Math.random();
      // نحسب موضع زر السلة في الهيدر (top-right)
      const targetX = window.innerWidth - 50;
      const targetY = 20;
      setAnimations(prev => [...prev, {
        id,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        targetX,
        targetY,
      }]);
      setTimeout(() => {
        setAnimations(prev => prev.filter(a => a.id !== id));
      }, 900);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter(fn => fn !== handler); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      <AnimatePresence>
        {animations.map(a => (
          <motion.div
            key={a.id}
            initial={{ x: a.startX, y: a.startY, scale: 1, opacity: 1 }}
            animate={{ x: a.targetX, y: a.targetY, scale: 0.3, opacity: 0.7 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'fixed', top: 0, left: 0 }}
          >
            <div className="w-9 h-9 rounded-full bg-primary shadow-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}