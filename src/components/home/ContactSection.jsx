import { useState } from 'react';
import { Send, Bell, MessageCircle, Phone, Mail, Instagram, Facebook, Twitter, Youtube, Music2, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ContactSection({ settings }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [subPhone, setSubPhone] = useState('');
  const [sending, setSending] = useState(false);

  const handleContact = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return toast.error('يرجى ملء جميع الحقول');
    setSending(true);
    const res = await base44.functions.invoke('submit-contact', form);
    if (!res.data?.success) {
      setSending(false);
      return toast.error(res.data?.error || 'تعذر إرسال الرسالة');
    }
    toast.success('تم إرسال رسالتك بنجاح!');
    setForm({ name: '', phone: '', message: '' });
    setSending(false);
  };

  const handleSubscribe = async () => {
    if (!subPhone) return toast.error('أدخل رقم هاتفك');
    const res = await base44.functions.invoke('subscribe', { phone: subPhone });
    if (!res.data?.success) return toast.error(res.data?.error || 'تعذر الاشتراك');
    toast.success('تم الاشتراك بنجاح!');
    setSubPhone('');
  };

  const socials = [
    settings?.whatsapp_number && { icon: MessageCircle, label: 'واتساب', href: `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`, color: 'bg-green-500' },
    settings?.social_instagram && { icon: Instagram, label: 'انستغرام', href: settings.social_instagram, color: 'bg-pink-500' },
    settings?.social_facebook && { icon: Facebook, label: 'فيسبوك', href: settings.social_facebook, color: 'bg-blue-600' },
    settings?.social_twitter && { icon: Twitter, label: 'تويتر', href: settings.social_twitter, color: 'bg-sky-500' },
    settings?.social_youtube && { icon: Youtube, label: 'يوتيوب', href: settings.social_youtube, color: 'bg-red-600' },
    settings?.social_tiktok && { icon: Music2, label: 'تيك توك', href: settings.social_tiktok, color: 'bg-black' },
    settings?.social_telegram && { icon: Send, label: 'تيليجرام', href: settings.social_telegram, color: 'bg-blue-500' },
    settings?.social_snapchat && { icon: Ghost, label: 'سناب شات', href: settings.social_snapchat, color: 'bg-yellow-400' },
  ].filter(Boolean);

  const serviceContacts = [
    settings?.footer_phone && { icon: Phone, label: 'اتصال مباشر', href: `tel:${settings.footer_phone}`, color: 'bg-blue-500' },
    settings?.whatsapp_number && { icon: MessageCircle, label: 'واتساب خدمة العملاء', href: `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`, color: 'bg-green-500' },
    settings?.footer_email && { icon: Mail, label: 'البريد الإلكتروني', href: `mailto:${settings.footer_email}`, color: 'bg-amber-500' },
  ].filter(Boolean);

  return (
    <section className="my-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* وسائل التواصل */}
        {socials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
          >
            <h3 className="font-heading font-bold text-lg mb-4">وسائل التواصل</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {socials.map((m, i) => (
                <a key={i} href={m.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-accent transition-colors">
                  <div className={`w-10 h-10 ${m.color} rounded-full flex items-center justify-center text-white`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{m.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* خدمة العملاء */}
        {serviceContacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
          >
            <h3 className="font-heading font-bold text-lg mb-4">خدمة العملاء</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {serviceContacts.map((m, i) => (
                <a key={i} href={m.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-accent transition-colors">
                  <div className={`w-9 h-9 ${m.color} rounded-full flex items-center justify-center text-white shrink-0`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{m.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Service Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
          >
            <h3 className="font-heading font-bold text-lg mb-4">أرسل لنا رسالة</h3>
            <form onSubmit={handleContact} className="space-y-3">
              <Input placeholder="الاسم" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="رقم الهاتف" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Textarea placeholder="رسالتك..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} />
              <Button type="submit" className="w-full" disabled={sending}>
                <Send className="w-4 h-4 ml-2" /> {sending ? 'جاري الإرسال...' : 'إرسال'}
              </Button>
            </form>
          </motion.div>

          {/* Subscribe */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 to-accent rounded-2xl p-6 border border-primary/20 shadow-sm flex flex-col justify-center"
          >
            <div className="text-center mb-4">
              <Bell className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg">اشترك في النشرة</h3>
              <p className="text-sm text-muted-foreground mt-1">كن أول من يعرف عن العروض والمنتجات الجديدة</p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="رقم الهاتف" value={subPhone} onChange={e => setSubPhone(e.target.value)} className="flex-1" />
              <Button onClick={handleSubscribe} size="icon" className="shrink-0">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}