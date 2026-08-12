import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function useStaffAccess() {
  const { user, isLoadingAuth } = useAuth();
  const [access, setAccess] = useState({ isStaff: false, superAdmin: false, permissions: {} });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) { setAccess({ isStaff: false, superAdmin: false, permissions: {} }); setLoading(false); return; }
    base44.functions.invoke('get-staff-access', {}).then(res => setAccess(res.data || {})).catch(() => setAccess({ isStaff: false, superAdmin: false, permissions: {} })).finally(() => setLoading(false));
  }, [user?.id, isLoadingAuth]);
  return { ...access, loading };
}