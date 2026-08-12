import { useEffect, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const load = () => base44.functions.invoke('get-notifications', {}).then(res => setItems(res.data?.notifications || [])).catch(() => setItems([]));
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    const unsubscribe = base44.entities.Notification.subscribe(() => load());
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); unsubscribe?.(); };
  }, []);
  const openItem = async item => {
    const target = await base44.functions.invoke('resolve-notification-target', { notification_id: item.id });
    if (!target.data?.success) return toast.error(target.data?.error || 'تعذر فتح الإشعار');
    await base44.functions.invoke('mark-notification-read', { notification_id: item.id });
    setItems(current => current.map(value => value.id === item.id ? { ...value, is_read: true } : value));
    setOpen(false); navigate(target.data.route);
  };
  const markAll = async () => {
    const result = await base44.functions.invoke('mark-all-notifications-read', {});
    if (!result.data?.success) return toast.error(result.data?.error || 'تعذر تحديث الإشعارات');
    setItems(current => current.map(item => ({ ...item, is_read: true }))); toast.success('تم تعليم كل الإشعارات كمقروءة');
  };
  const unread = items.filter(item => !item.is_read).length;
  return <div className="relative"><button onClick={() => { setOpen(value => !value); load(); }} className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors text-foreground relative"><Bell className="w-4 h-4" />{unread > 0 && <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold">{unread}</span>}</button><AnimatePresence>{open && <><div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /><motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"><div className="flex items-center justify-between gap-2 p-3 border-b border-border/50"><span className="font-bold text-sm flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" /> الإشعارات</span><div className="flex items-center gap-1">{unread > 0 && <button onClick={markAll} className="text-[11px] text-primary font-bold inline-flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" />تعليم الكل</button>}<button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div></div><div className="max-h-80 overflow-y-auto">{items.length === 0 ? <p className="text-center text-xs text-muted-foreground py-6">لا توجد إشعارات</p> : items.map(item => <button key={item.id} onClick={() => openItem(item)} className={`w-full text-right p-3 border-b border-border/30 flex gap-2 items-start hover:bg-accent/50 ${item.is_read ? 'opacity-70' : 'bg-primary/5'}`}><span className="text-xl shrink-0">{item.icon || '🔔'}</span><span className="flex-1 min-w-0"><span className="block font-bold text-xs">{item.title}</span><span className="block text-[11px] text-muted-foreground leading-relaxed">{item.message}</span></span></button>)}</div></motion.div></>}</AnimatePresence></div>;
}