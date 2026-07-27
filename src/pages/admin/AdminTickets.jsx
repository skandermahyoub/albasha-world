import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ticket as TicketIcon, Send, ChevronLeft, User, Headphones, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { logAction } from '@/lib/auditLog';

const STATUS_OPTIONS = [
  { value: 'open', label: 'مفتوحة', color: 'bg-green-100 text-green-700' },
  { value: 'in_progress', label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-700' },
  { value: 'waiting_customer', label: 'بانتظار العميل', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'resolved', label: 'تم الحل', color: 'bg-purple-100 text-purple-700' },
  { value: 'closed', label: 'مغلقة', color: 'bg-gray-100 text-gray-700' },
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
};

const CATEGORY_LABELS = {
  order_issue: 'مشكلة طلب', product_issue: 'مشكلة منتج', payment_issue: 'مشكلة دفع',
  shipping_issue: 'مشكلة شحن', account_issue: 'مشكلة حساب', general: 'استفسار عام', complaint: 'شكوى',
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const t = await base44.entities.Ticket.list('-created_date', 200).catch(() => []);
    setTickets(t);
  };
  useEffect(() => { load(); }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const messages = selected.messages || [];
      messages.push({
        sender: 'الدعم الفني',
        sender_role: 'agent',
        message: reply.trim(),
        timestamp: new Date().toISOString(),
      });
      const updated = await base44.entities.Ticket.update(selected.id, {
        messages,
        status: selected.status === 'open' ? 'in_progress' : selected.status,
        first_response_at: selected.first_response_at || new Date().toISOString(),
      });
      await logAction({
        action: 'update',
        entityType: 'Ticket',
        entityId: selected.id,
        entityName: selected.subject,
        description: `رد على التذكرة #${selected.ticket_number}`,
      });
      toast.success('تم إرسال الرد');
      setReply('');
      setSelected({ ...selected, ...updated, messages });
      load();
    } catch (e) {
      toast.error('فشل إرسال الرد');
    }
    setSending(false);
  };

  const changeStatus = async (newStatus) => {
    if (!selected) return;
    try {
      const updates = { status: newStatus };
      if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();
      await base44.entities.Ticket.update(selected.id, updates);
      await logAction({
        action: 'update',
        entityType: 'Ticket',
        entityId: selected.id,
        entityName: selected.subject,
        description: `تغيير حالة التذكرة #${selected.ticket_number} إلى ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`,
      });
      toast.success('تم تحديث الحالة');
      setSelected({ ...selected, ...updates });
      load();
    } catch (e) {
      toast.error('فشل تحديث الحالة');
    }
  };

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4 flex items-center gap-2">
        <TicketIcon className="w-6 h-6" /> نظام التذاكر
      </h1>

      <div className="space-y-2">
        {tickets.map(t => {
          const status = STATUS_OPTIONS.find(s => s.value === t.status) || STATUS_OPTIONS[0];
          const lastMsg = t.messages?.[t.messages.length - 1];
          return (
            <div key={t.id}
              onClick={() => setSelected(t)}
              className="bg-card border border-border/50 rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">#{t.ticket_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm font-medium truncate">{t.subject}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{t.customer_name}</span>
                {lastMsg && <span className="text-[11px] text-muted-foreground truncate">• {lastMsg.sender}: {lastMsg.message}</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">{CATEGORY_LABELS[t.category] || t.category}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium}`}>{t.priority}</span>
                <span className="text-[11px] text-muted-foreground mr-auto">{new Date(t.created_date).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          );
        })}
        {tickets.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد تذاكر</p>}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="w-full max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-primary" /> #{selected.ticket_number}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-base">{selected.subject}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{CATEGORY_LABELS[selected.category] || selected.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[selected.priority] || PRIORITY_COLORS.medium}`}>{selected.priority}</span>
                    <span className="text-xs text-muted-foreground">{selected.customer_name} • {selected.customer_email}</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-2 max-h-64 overflow-y-auto bg-secondary rounded-lg p-3">
                  {selected.messages?.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender_role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-lg p-2 ${msg.sender_role === 'agent' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {msg.sender_role === 'agent' ? <Headphones className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <span className="text-[11px] font-bold">{msg.sender}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-[10px] opacity-60 mt-1">{msg.timestamp ? new Date(msg.timestamp).toLocaleString('ar-EG') : ''}</p>
                      </div>
                    </div>
                  ))}
                  {!selected.messages?.length && <p className="text-center text-muted-foreground text-sm py-4">لا توجد رسائل</p>}
                </div>

                {/* Status Change */}
                <div className="flex gap-1 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => changeStatus(s.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-all ${selected.status === s.value ? s.color + ' ring-2 ring-offset-1' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Reply */}
                {selected.status !== 'closed' && (
                  <div className="space-y-2">
                    <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="اكتب ردك..." rows={3} />
                    <Button onClick={handleReply} disabled={sending || !reply.trim()} className="w-full">
                      <Send className="w-4 h-4 ml-2" /> {sending ? 'جاري الإرسال...' : 'إرسال الرد'}
                    </Button>
                  </div>
                )}
                {selected.status === 'closed' && (
                  <p className="text-center text-sm text-muted-foreground py-2">هذه التذكرة مغلقة</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}