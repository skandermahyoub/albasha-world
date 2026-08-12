import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const load = () => base44.functions.invoke('get-notifications', {}).then(res => setItems(res.data?.notifications || [])).catch(() => setItems([]));

  useEffect(() => { load(); }, []);

  const openItem = async (item) => {
    await base44.functions.invoke('mark-notification-read', { notification_id: item.id });
    setItems(current => current.map(value => value.id === item.id ? { ...value, is_read: true } : value));
    setOpen(false);
    navigate(item.target_route || '/my-account');
  };

  const unread = items.filter(item => !item.is_read).length;
  return (
    <div className="relative">
      <button onClick={() => { setOpen(value => !value); load(); }} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors text-foreground relative">
        <Bell className="w-4 h-4" />
        {unread > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold">{unread}</span>}
      </button>
      <AnimatePresence>{open && <>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border/50"><span className="font-bold text-sm flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" /> الإشعارات</span><button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">لا توجد إشعارات</p> : items.map(item => <button key={item.id} onClick={() => openItem(item)} className={`w-full text-right p-3 border-b border-border/30 flex gap-2 items-start hover:bg-accent/50 ${item.is_read ? 'opacity-70' : 'bg-primary/5'}`}><span className="text-xl shrink-0">{item.icon || '🔔'}</span><span className="flex-1 min-w-0"><span className="block font-bold text-xs">{item.title}</span><span className="block text-[11px] text-muted-foreground leading-relaxed">{item.message}</span></span></button>)}
          </div>
        </motion.div>
      </>}</AnimatePresence>
    </div>
  );
}