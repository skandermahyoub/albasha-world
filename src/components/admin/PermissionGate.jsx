import { Loader2, ShieldX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminPermissions } from '@/lib/useAdminPermissions';
import { Link } from 'react-router-dom';

/**
 * Component-level permission gate.
 * Wraps any UI to hide/disable it if the admin lacks the required level.
 *
 * Usage:
 *   <PermissionGate section="products" level="edit">
 *     <Button onClick={handleEdit}>تعديل</Button>
 *   </PermissionGate>
 */
export default function PermissionGate({ section, level = 'view', children, fallback = null, hideOnDeny = true }) {
  const { can, loading } = useAdminPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (can(section, level)) return children;

  if (hideOnDeny) return fallback;

  return (
    <span className="opacity-40 pointer-events-none cursor-not-allowed" title="ليس لديك صلاحية كافية">
      {children}
    </span>
  );
}

export function NoPermission() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 text-center max-w-sm"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-heading font-bold text-xl text-destructive mb-2">ليس لديك صلاحية</h2>
        <p className="text-sm text-muted-foreground mb-4">
          لا تملك الصلاحية الكافية للوصول إلى هذا القسم. تواصل مع مدير النظام إذا كنت تعتقد أنك بحاجة للوصول.
        </p>
        <Link
          to="/admin"
          className="inline-block text-sm text-primary hover:underline"
        >
          العودة إلى لوحة التحكم
        </Link>
      </motion.div>
    </div>
  );
}