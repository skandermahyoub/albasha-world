import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [current, setCurrent] = useState(null);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    base44.functions.invoke('get-notifications', {})
      .then(res => setNotifications(res.data?.notifications || []))
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (!notifications.length) return;

    const showNext = () => {
      const notif = notifications[indexRef.current % notifications.length];
      indexRef.current++;
      setCurrent(notif);

      const hideTimer = setTimeout(() => setCurrent(null), 6000);
      const interval = (notif.interval_minutes || 5) * 60 * 1000;
      timerRef.current = setTimeout(() => {
        clearTimeout(hideTimer);
        setCurrent(null);
        setTimeout(showNext, 800);
      }, interval);
    };

    const initial = setTimeout(showNext, 8000);
    return () => { clearTimeout(initial); clearTimeout(timerRef.current); };
  }, [notifications]);

  const dismiss = () => {
    setCurrent(null);
    clearTimeout(timerRef.current);
    const next = notifications[indexRef.current % notifications.length];
    if (next) {
      timerRef.current = setTimeout(() => {
        indexRef.current++;
        setCurrent(next);
        setTimeout(() => setCurrent(null), 6000);
      }, (next.interval_minutes || 5) * 60 * 1000);
    }
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-24 z-[80] left-3 right-3 max-w-sm mx-auto"
        >
          <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 p-4 flex gap-3 items-start">
            <span className="text-2xl shrink-0">{current.icon || '🎉'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm">{current.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{current.message}</p>
              <Link to="/shop" onClick={dismiss} className="text-xs text-primary font-bold mt-1.5 inline-block hover:underline">
                اكتشف الآن ←
              </Link>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}