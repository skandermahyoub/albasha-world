import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import ContactSection from '@/components/home/ContactSection';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { useCart } from '@/lib/useCart';

export default function Contact() {
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    base44.entities.StoreSettings.list().then(s => setSettings(s[0] || {})).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 pb-24">
        <h1 className="font-heading font-bold text-3xl text-center mb-2 pt-4">تواصل معنا</h1>
        <p className="text-center text-muted-foreground mb-6">نحب أن نسمع منك</p>
        <ContactSection settings={settings} />
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}