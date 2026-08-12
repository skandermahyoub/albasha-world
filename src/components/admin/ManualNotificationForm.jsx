import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ManualNotificationForm() {
  const [profiles, setProfiles] = useState([]); const [form, setForm] = useState({ title: '', message: '', customer_email: '', broadcast: false }); const [sending, setSending] = useState(false);
  useEffect(() => { base44.entities.CustomerProfile.list('-created_date', 500).then(setProfiles).catch(() => {}); }, []);
  const send = async () => { setSending(true); const res = await base44.functions.invoke('send-notification', form); setSending(false); if (!res.data?.success) return toast.error(res.data?.error || 'تعذر الإرسال'); toast.success(`تم إرسال الإشعار إلى ${res.data.recipients} مستلم`); setForm({ title: '', message: '', customer_email: '', broadcast: false }); };
  return <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 mb-6"><h2 className="font-bold">إرسال إشعار</h2><Input placeholder="العنوان" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /><Textarea placeholder="الرسالة" value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} /><label className="flex gap-2 text-sm items-center"><input type="checkbox" checked={form.broadcast} onChange={event => setForm({ ...form, broadcast: event.target.checked, customer_email: '' })} />إرسال إلى جميع العملاء</label>{!form.broadcast && <select className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.customer_email} onChange={event => setForm({ ...form, customer_email: event.target.value })}><option value="">اختر العميل</option>{profiles.map(profile => <option key={profile.id} value={profile.user_email}>{profile.full_name || profile.name || profile.user_email} — {profile.user_email}</option>)}</select>}<Button onClick={send} disabled={sending} className="w-full">{sending ? 'جارٍ الإرسال...' : 'إرسال الإشعار'}</Button></div>;
}