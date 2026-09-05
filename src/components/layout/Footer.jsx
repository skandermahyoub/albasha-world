import { Link } from 'react-router-dom';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useStoreSettings } from '@/lib/useStoreSettings';

function NewsletterForm() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!phone.trim()) return toast.error('أدخل رقم الهاتف');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('subscribe', { phone: phone.trim(), name: name.trim() });
      if (!res.data?.success) throw new Error(res.data?.error || 'تعذر الاشتراك');
      toast.success('تم الاشتراك بنجاح! سنوافيك بأحدث العروض');
      setPhone(''); setName('');
    } catch (err) {
      toast.error('فشل الاشتراك، حاول مجدداً');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="الاسم (اختياري)"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-colors"
      />
      <div className="flex gap-2">
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="رقم الهاتف"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 transition-colors"
        />
        <button
          onClick={subscribe}
          disabled={loading}
          className="px-5 py-2.5 btn-luxury rounded-xl text-sm font-bold transition-all shrink-0 disabled:opacity-60"
        >
          {loading ? '...' : 'اشترك'}
        </button>
      </div>
    </div>
  );
}

export default function Footer({ settings: propSettings }) {
  const { settings: ctxSettings } = useStoreSettings();
  const settings = { ...ctxSettings, ...propSettings };
  const storeName = settings?.store_name || 'متجري';
  return (
    <footer className="relative mt-16 overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-white">
      {/* Decorative gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            {settings?.logo_url && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 mb-4 border border-white/10 shadow-lg">
                <img src={settings.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
              </div>
            )}
            <h3 className="font-heading font-extrabold text-xl mb-3 text-gradient-luxury">{storeName}</h3>
            <p className="text-white/50 text-sm leading-relaxed font-body">
              {settings?.footer_about || `مرحباً بكم في ${storeName}`}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4 text-white/90 relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-1.5 right-0 w-8 h-0.5 bg-primary rounded-full" />
            </h3>
            <div className="space-y-2.5">
              {[
                { to: '/shop', label: 'المتجر' },
                { to: '/blog', label: 'المجلة' },
                { to: '/loyalty', label: 'نقاط الولاء' },
                { to: '/contact', label: 'تواصل معنا' },
              ].map(link => (
                <Link key={link.to} to={link.to} className="block text-white/50 hover:text-primary hover:pr-2 transition-all text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4 text-white/90 relative inline-block">
              اشترك للعروض
              <span className="absolute -bottom-1.5 right-0 w-8 h-0.5 bg-primary rounded-full" />
            </h3>
            <p className="text-white/50 text-xs mb-3 leading-relaxed">سجّل رقمك ليصلك كل جديد وعروضنا الحصرية</p>
            <NewsletterForm />
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-base mb-4 text-white/90 relative inline-block">
              تواصل معنا
              <span className="absolute -bottom-1.5 right-0 w-8 h-0.5 bg-primary rounded-full" />
            </h3>
            <div className="space-y-2.5 text-sm text-white/50">
              {settings?.footer_phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>{settings.footer_phone}</span>
                </div>
              )}
              {settings?.footer_email && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>{settings.footer_email}</span>
                </div>
              )}
              {settings?.footer_address && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{settings.footer_address}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2.5 mt-4 flex-wrap">
              {settings?.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.29.2 2.29.2v2.5h-1.29c-1.27 0-1.67.79-1.67 1.6V12h2.84l-.45 2.89h-2.39v6.98A10 10 0 0022 12z"/></svg>
                </a>
              )}
              {(settings?.social_whatsapp || settings?.whatsapp_number) && (
                <a href={settings.social_whatsapp || `https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.94 9.94 0 0012.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.18c-1.6 0-3.13-.42-4.45-1.2l-.32-.19-3.31.87.88-3.23-.21-.33a8.16 8.16 0 01-1.27-4.4c0-4.52 3.68-8.2 8.2-8.2 4.51 0 8.19 3.68 8.19 8.2 0 4.51-3.68 8.2-8.19 8.2z"/></svg>
                </a>
              )}
              {settings?.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {settings?.social_tiktok && (
                <a href={settings.social_tiktok} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/></svg>
                </a>
              )}
              {settings?.social_telegram && (
                <a href={settings.social_telegram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.173-.18 3.157-2.893 3.216-3.138.008-.03.011-.142-.053-.2-.064-.058-.16-.038-.23-.022-.098.022-1.658 1.053-4.679 3.088-.443.304-.844.452-1.206.441-.396-.012-1.157-.224-1.722-.408-.693-.225-1.245-.345-1.197-.728.024-.192.3-.388.824-.586 3.234-1.41 5.39-2.34 6.464-2.778 3.078-1.279 3.716-1.503 4.132-1.51z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col items-center gap-2">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} {storeName}. {settings?.copyright_text || 'جميع الحقوق محفوظة'}</p>
          <p className="text-white/20 text-[10px]">هذا التطبيق يعمل بنظام أوركس إس إس الإصدار 3.2 — oryx.business</p>
        </div>
      </div>
    </footer>
  );
}