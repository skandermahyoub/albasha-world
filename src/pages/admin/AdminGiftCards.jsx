import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Trash2, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

function generateCode() {
  return 'BASHA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function AdminGiftCards() {
  const [cards, setCards] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: 100, currency: 'SAR', issued_to_email: '', message: '' });

  const load = () => base44.entities.GiftCard.list('-created_date', 200).then(setCards).catch(() => []);
  useEffect(() => { load(); }, []);

  const create = async () => {
    const code = generateCode();
    await base44.entities.GiftCard.create({
      code,
      amount: Number(form.amount),
      currency: form.currency || 'SAR',
      used_amount: 0,
      issued_to_email: form.issued_to_email,
      message: form.message,
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
    toast.success(`تم إنشاء البطاقة: ${code}`);
    setDialogOpen(false);
    setForm({ amount: 100, currency: 'SAR', issued_to_email: '', message: '' });
    load();
  };

  const activateCard = async (id) => {
    await base44.entities.GiftCard.update(id, { status: 'active' });
    toast.success('تم تفعيل البطاقة'); load();
  };

  const deleteCard = async (id) => {
    if (!confirm('حذف هذه البطاقة؟')) return;
    await base44.entities.GiftCard.delete(id);
    toast.success('تم الحذف'); load();
  };

  const totalValue = cards.reduce((s, c) => s + (c.amount || 0), 0);
  const usedValue = cards.reduce((s, c) => s + (c.used_amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">كوبونات التخفيض</h1>
          <p className="text-sm text-muted-foreground">{cards.length} كوبون | إجمالي القيمة: {totalValue} | مستخدم: {usedValue}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 ml-2" /> كوبون جديد</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'نشطة', count: cards.filter(c => c.status === 'active').length, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'مستخدمة', count: cards.filter(c => c.status === 'used').length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'منتهية', count: cards.filter(c => c.status === 'expired').length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards List */}
      <div className="space-y-2">
        {cards.map(card => (
          <div key={card.id} className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${card.status === 'active' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-secondary'}`}>
              {card.status === 'active' ? <CheckCircle className="w-5 h-5 text-orange-600" /> : card.status === 'used' ? <Clock className="w-5 h-5 text-blue-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold font-mono text-sm">{card.code}</p>
              <p className="text-xs text-muted-foreground truncate">
                {card.issued_to_email && `إلى: ${card.issued_to_email}`}
                {card.issued_by_email && ` | من: ${card.issued_by_email}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary">{card.amount - (card.used_amount || 0)} / {card.amount} {card.currency || 'SAR'}</p>
              <p className="text-[10px] text-muted-foreground">{card.status === 'active' ? 'نشطة' : card.status === 'used' ? 'مستخدمة' : 'منتهية'}</p>
            </div>
            {card.status === 'pending' && (
              <Button variant="outline" size="sm" className="text-green-600 border-green-300" onClick={() => activateCard(card.id)}>
                <CheckCircle className="w-3.5 h-3.5 ml-1" /> تفعيل
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCard(card.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        {cards.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد بطاقات هدايا</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>إنشاء كوبون تخفيض</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input type="number" placeholder="القيمة" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="flex-1" />
              <select className="rounded-lg border border-input bg-background px-3 text-sm" value={form.currency || 'SAR'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="SAR">ريال سعودي</option>
                <option value="YER_OLD">يمني قديم</option>
                <option value="YER_NEW">يمني جديد</option>
                <option value="AED">درهم إماراتي</option>
                <option value="USD">دولار</option>
              </select>
            </div>
            <Input placeholder="البريد الإلكتروني للمستلم" value={form.issued_to_email} onChange={e => setForm(f => ({ ...f, issued_to_email: e.target.value }))} />
            <Input placeholder="رسالة (اختياري)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            <Button onClick={create} className="w-full"><Gift className="w-4 h-4 ml-2" /> إنشاء الكوبون</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}