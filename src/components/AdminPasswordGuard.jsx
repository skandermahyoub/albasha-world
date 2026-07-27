import { motion } from 'framer-motion';
import { Lock, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function AdminPasswordGuard({ children }) {
  const { user, isLoadingAuth, isAuthenticated, navigateToLogin } = useAuth();
  const { settings } = useStoreSettings();

  const storeName = settings?.store_name || 'عالم الباشا للتسوق';
  const slogan = settings?.slogan || 'عالمك المتكامل للشيشة والبوتيك والعطور والفيب ومستلزمات الحيوانات الأليفة';
  const logo = settings?.logo_url;

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [isLoadingAuth, isAuthenticated, navigateToLogin]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جارٍ التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative" dir="rtl">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-destructive/10 rounded-full blur-[110px]" />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="glass-card rounded-3xl p-7 md:p-8 shadow-2xl border-border/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-destructive via-amber-500 to-destructive" />

            <div className="flex flex-col items-center mb-6 mt-2">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                {logo ? (
                  <img src={logo} alt={storeName} className="w-20 h-20 rounded-2xl object-cover shadow-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-amber-600 flex items-center justify-center shadow-xl">
                    <Lock className="w-9 h-9 text-white" />
                  </div>
                )}
              </motion.div>

              <h1 className="font-heading font-extrabold text-xl text-destructive">صلاحية غير كافية</h1>
              <p className="text-[11px] text-muted-foreground mt-2 text-center max-w-[15rem] leading-relaxed">
                لا تملك صلاحية الوصول إلى لوحة التحكم. هذه المنطقة مخصصة للمديرين فقط.
              </p>

              <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                <ShieldCheck className="w-3 h-3 text-destructive" />
                <span className="text-[11px] font-bold text-destructive">دخول مرفوض</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                بحسابك الحالي: <span className="font-bold">{user?.email || user?.full_name || 'مستخدم'}</span>
              </p>
              <p className="text-[10px] text-center text-muted-foreground/70">
                الرجاء تسجيل الدخول بحساب مدير للوصول إلى لوحة التحكم
              </p>
            </div>

            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 mt-5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              العودة إلى المتجر
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return children;
}