import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share, Plus, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function InstallPrompt() {
  const { settings } = useStoreSettings();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem('pwa_dismissed')) return;

    // Only show after 2+ visits (not first visit) to avoid annoying new users
    const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10) + 1;
    localStorage.setItem('pwa_visit_count', String(visitCount));
    if (visitCount < 2) return;

    // If previously dismissed permanently, don't show again for 7 days
    const dismissedAt = localStorage.getItem('pwa_dismissed_at');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    const desktop = !ios && !/android/i.test(navigator.userAgent);

    if (ios) {
      setIsIOS(true);
      setIsDesktop(false);
      setTimeout(() => setVisible(true), 15000);
      return;
    }

    if (desktop) {
      setIsDesktop(true);
      setTimeout(() => setVisible(true), 18000);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsDesktop(false);
      setTimeout(() => setVisible(true), 12000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa_dismissed', '1');
    localStorage.setItem('pwa_dismissed_at', String(Date.now()));
  };

  if (!visible) return null;

  const storeName = settings?.store_name || 'عالم الباشا للتسوق';
  const logo = settings?.logo_url;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        dir="rtl"
        onClick={dismiss}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="bg-card border border-primary/30 rounded-3xl shadow-2xl shadow-primary/10 max-w-sm w-full overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-primary/15 to-accent/10 p-6 text-center">
            <button onClick={dismiss} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-background/50 hover:bg-background flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* App Icon */}
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20">
              {logo ? (
                <img src={logo} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="font-heading font-black text-3xl text-primary-foreground">ع</span>
                </div>
              )}
            </div>

            <h3 className="font-heading font-extrabold text-lg">ثبّت {storeName}</h3>
            <p className="text-xs text-muted-foreground mt-1">على جهازك للوصول السريع والتسوق بسهولة</p>
          </div>

          {/* Instructions */}
          <div className="p-5 space-y-3">
            {isIOS ? (
              <>
                <div className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">الخطوة 1</p>
                    <p className="text-xs text-muted-foreground">اضغط على زر المشاركة <Share className="w-3 h-3 inline" /> في سفاري</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">الخطوة 2</p>
                    <p className="text-xs text-muted-foreground">اختر «إضافة إلى الشاشة الرئيسية»</p>
                  </div>
                </div>
                <Button onClick={dismiss} className="w-full h-10 mt-2">تم</Button>
              </>
            ) : isDesktop ? (
              <>
                <div className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Monitor className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">تثبيت على سطح المكتب</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      اضغط على أيقونة التثبيت <Download className="w-3 h-3 inline mx-0.5" /> في شريط عنوان المتصفح، ثم اختر «تثبيت»
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">أو من قائمة المتصفح</p>
                    <p className="text-xs text-muted-foreground mt-0.5">افتح القائمة (⋮) واختر «تثبيت التطبيق»</p>
                  </div>
                </div>
                <Button onClick={dismiss} className="w-full h-10 mt-2">فهمت</Button>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 bg-secondary/50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">تثبيت سريع</p>
                    <p className="text-xs text-muted-foreground mt-0.5">أضف التطبيق لشاشتك الرئيسية بضغطة واحدة — بدون متجر تطبيقات</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleInstall} className="flex-1 h-10 gap-2">
                    <Download className="w-4 h-4" />
                    تثبيت الآن
                  </Button>
                  <Button onClick={dismiss} variant="outline" className="h-10">لاحقاً</Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}