import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [email, setEmail] = useState(null);

  useEffect(() => { base44.auth.me().then(me => setEmail(me?.email || null)).catch(() => {}); }, []);
  useEffect(() => {
    base44.entities.Notification.list('sort_order', 50)
      .then(all => setItems(all.filter(n => n.is_active !== false && (!n.customer_email || n.customer_email === email))))
      .catch(() => {});
  }, [email]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors text-foreground relative">
        <Bell className="w-4 h-4" />
        {items.length > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold">{items.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border/50">
                <span className="font-bold text-sm flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" /> الإشعارات</span>
                <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">لا توجد إشعارات</p> :
                  items.map(n => (
                    <div key={n.id} className="p-3 border-b border-border/30 flex gap-2 items-start">
                      <span className="text-xl shrink-0">{n.icon || '🎉'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}