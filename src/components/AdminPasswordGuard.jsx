import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import useStaffAccess from '@/lib/useStaffAccess';

export default function AdminPasswordGuard({ children }) {
  const { isLoadingAuth, isAuthenticated, navigateToLogin } = useAuth();
  const { settings } = useStoreSettings();
  const { isStaff, loading } = useStaffAccess();
  useEffect(() => { if (!isLoadingAuth && !isAuthenticated) navigateToLogin(); }, [isLoadingAuth, isAuthenticated, navigateToLogin]);
  if (isLoadingAuth || loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!isAuthenticated) return null;
  if (!isStaff) return <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-8 w-full max-w-sm text-center"><div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center mb-4"><Lock className="w-7 h-7" /></div><h1 className="font-heading font-bold text-xl">صلاحية غير كافية</h1><p className="text-sm text-muted-foreground mt-2">هذه المنطقة متاحة للموظفين النشطين فقط.</p><Link to="/" className="inline-flex items-center gap-2 mt-5 text-sm text-primary"><ArrowLeft className="w-4 h-4" />العودة إلى المتجر</Link></motion.div></div>;
  return children;
}