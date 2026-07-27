import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Shield, ShieldCheck, ShieldOff, Key, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PermissionGate from '@/components/admin/PermissionGate';
import { useAdminPermissions } from '@/lib/useAdminPermissions';

const SECTIONS = [
  { key: 'orders', label: 'الطلبات' },
  { key: 'customers', label: 'العملاء' },
  { key: 'stores', label: 'النشاطات/المحلات' },
  { key: 'products', label: 'المنتجات' },
  { key: 'coupons', label: 'الكوبونات' },
  { key: 'accounting', label: 'الحسابات' },
  { key: 'reports', label: 'التقارير' },
  { key: 'settings', label: 'الإعدادات' },
  { key: 'employees', label: 'الموظفين' },
  { key: 'crm', label: 'نظام CRM' },
  { key: 'delivery', label: 'التوصيل' },
  { key: 'blog', label: 'المدونة' },
];

const PERM_LABELS = {
  none: 'لا يُسمح',
  view: 'عرض فقط',
  add: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  full: 'صلاحية كاملة',
};

const PERM_COLORS = {
  none: 'bg-red-100 text-red-700',
  view: 'bg-gray-100 text-gray-600',
  add: 'bg-blue-100 text-blue-700',
  edit: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-orange-100 text-orange-700',
  full: 'bg-green-100 text-green-700',
};

const DEFAULT_PERMISSIONS = SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: 'none' }), {});

export default function AdminSystemAdmins() {
  const [admins, setAdmins] = useState([]);
  const [open, setOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [permTarget, setPermTarget] = useState(null);
  const [form, setForm] = useState({ name: '', employee_number: '', email: '', password_hash: '', is_active: true });
  const [permissions, setPermissions] = useState({ ...DEFAULT_PERMISSIONS });
  const [step, setStep] = useState('info');
  const { permissions: myPerms } = useAdminPermissions();
  const isSuperAdmin = myPerms?._super === true;

  const load = () => base44.entities.SystemAdmin.list('-created_date', 200).catch(() => []).then(setAdmins);
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', employee_number: '', email: '', password_hash: '', is_active: true });
    setPermissions({ ...DEFAULT_PERMISSIONS });
    setStep('info');
    setOpen(true);
  };

  const openEdit = (admin) => {
    setEditing(admin);
    setForm({ name: admin.name, password_hash: admin.password_hash || '' });
    setOpen(true);
    setStep('info');
  };

  const openPerms = (admin) => {
    setPermTarget(admin);
    setPermissions({ ...DEFAULT_PERMISSIONS, ...(admin.permissions || {}) });
    setPermOpen(true);
  };

  const handleSaveInfo = async () => {
    if (!form.name) return toast.error('أدخل اسم الحساب');
    if (!editing) {
      if (!form.email || !form.password_hash) return toast.error('أدخل البريد الإلكتروني وكلمة المرور');
      setStep('perms');
    } else {
      try {
        const res = await base44.functions.invoke('manage-system-admin', {
          action: 'update',
          admin_id: editing.id,
          data: { name: form.name, password_hash: form.password_hash },
        });
        if (!res.data?.success) return toast.error(res.data?.error || 'فشل التحديث');
        toast.success('تم تحديث الحساب');
        setOpen(false); load();
      } catch (err) {
        toast.error('فشل التحديث');
      }
    }
  };

  const handleSaveNew = async () => {
    try {
      const res = await base44.functions.invoke('manage-system-admin', {
        action: 'create',
        data: { ...form, permissions, is_active: true },
      });
      if (!res.data?.success) return toast.error(res.data?.error || 'فشل إنشاء الحساب');
      toast.success('تم إنشاء الحساب');
      setOpen(false); load();
    } catch (err) {
      toast.error('فشل إنشاء الحساب');
    }
  };

  const handleSavePerms = async () => {
    try {
      const res = await base44.functions.invoke('manage-system-admin', {
        action: 'update',
        admin_id: permTarget.id,
        data: { permissions },
      });
      if (!res.data?.success) return toast.error(res.data?.error || 'فشل تحديث الصلاحيات');
      toast.success('تم تحديث الصلاحيات');
      setPermOpen(false); load();
    } catch (err) {
      toast.error('فشل تحديث الصلاحيات');
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      const res = await base44.functions.invoke('manage-system-admin', {
        action: 'update',
        admin_id: admin.id,
        data: { is_active: !admin.is_active },
      });
      if (!res.data?.success) return toast.error(res.data?.error || 'فشل التحديث');
      toast.success(admin.is_active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
      load();
    } catch (err) {
      toast.error('فشل التحديث');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا الحساب نهائياً؟')) return;
    try {
      const res = await base44.functions.invoke('manage-system-admin', {
        action: 'delete',
        admin_id: id,
      });
      if (!res.data?.success) return toast.error(res.data?.error || 'فشل الحذف');
      toast.success('تم الحذف');
      load();
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  const setAllPerms = (value) => {
    const all = SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: value }), {});
    setPermissions(all);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> مديري النظام
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة حسابات الموظفين وصلاحياتهم</p>
        </div>
        <PermissionGate section="settings" level="full">
          <Button onClick={openAdd}><Plus className="w-4 h-4 ml-2" /> إنشاء حساب</Button>
        </PermissionGate>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-700 dark:text-amber-400">أنت تتصفح كأدمن عادي — إنشاء وتعديل وحذف حسابات النظام متاح فقط لمدير النظام الرئيسي (Super Admin).</p>
        </div>
      )}

      {admins.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>لا توجد حسابات بعد</p>
        </div>
      )}

      <div className="space-y-3">
        {admins.map(admin => (
          <div key={admin.id} className={`bg-card rounded-xl border p-4 ${admin.is_active ? 'border-border/50' : 'border-red-200 dark:border-red-900 opacity-70'}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${admin.is_active ? 'bg-primary/10' : 'bg-red-100 dark:bg-red-950'}`}>
                  {admin.is_active ? <ShieldCheck className="w-5 h-5 text-primary" /> : <ShieldOff className="w-5 h-5 text-red-500" />}
                </div>
                <div>
                  <p className="font-bold">{admin.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {admin.email}
                    {admin.employee_number && <span className="mr-2 text-primary">· رقم: {admin.employee_number}</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Badge className={admin.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {admin.is_active ? 'مفعّل' : 'معطّل'}
                </Badge>
                <PermissionGate section="settings" level="full">
                  <Button size="sm" variant="outline" onClick={() => openPerms(admin)}>
                    <Key className="w-3.5 h-3.5 ml-1" /> الصلاحيات
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(admin)}>
                    <Pencil className="w-3.5 h-3.5 ml-1" /> تعديل
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleActive(admin)}
                    className={admin.is_active ? 'text-red-600 border-red-300' : 'text-green-600 border-green-300'}>
                    {admin.is_active ? 'تعطيل' : 'تفعيل'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(admin.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </PermissionGate>
              </div>
            </div>

            {/* Permissions summary */}
            {admin.permissions && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {SECTIONS.filter(s => (admin.permissions[s.key] || 'none') !== 'none').map(s => (
                  <span key={s.key} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PERM_COLORS[admin.permissions[s.key]] || ''}`}>
                    {s.label}: {PERM_LABELS[admin.permissions[s.key]]}
                  </span>
                ))}
                {SECTIONS.every(s => (admin.permissions[s.key] || 'none') === 'none') && (
                  <span className="text-[10px] text-muted-foreground">لا توجد صلاحيات محددة</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Account Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'تعديل الحساب' : step === 'info' ? 'إنشاء حساب جديد' : 'تحديد الصلاحيات'}
            </DialogTitle>
          </DialogHeader>
          {step === 'info' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">اسم الحساب *</label>
                <Input placeholder="اسم الموظف" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              {!editing && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">رقم الموظف</label>
                    <Input placeholder="مثال: EMP-001" value={form.employee_number || ''} onChange={e => setForm(f => ({ ...f, employee_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">البريد الإلكتروني * (اسم المستخدم)</label>
                    <Input type="email" placeholder="employee@example.com" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <p className="text-[10px] text-muted-foreground mt-1">لا يمكن تغييره بعد الإنشاء</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">كلمة المرور {editing ? '(اترك فارغاً للإبقاء)' : '*'}</label>
                <Input type="password" placeholder="كلمة المرور" value={form.password_hash || ''} onChange={e => setForm(f => ({ ...f, password_hash: e.target.value }))} />
              </div>
              <Button onClick={handleSaveInfo} className="w-full">
                {editing ? 'حفظ التعديلات' : 'التالي: تحديد الصلاحيات ←'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                <Button size="sm" variant="outline" onClick={() => setAllPerms('full')} className="flex-1">منح كل الصلاحيات</Button>
                <Button size="sm" variant="outline" onClick={() => setAllPerms('none')} className="flex-1">إلغاء كل الصلاحيات</Button>
              </div>
              {SECTIONS.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{s.label}</span>
                  <select
                    value={permissions[s.key] || 'none'}
                    onChange={e => setPermissions(p => ({ ...p, [s.key]: e.target.value }))}
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                  >
                    {Object.entries(PERM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep('info')} className="flex-1">← رجوع</Button>
                <Button onClick={handleSaveNew} className="flex-1">إنشاء الحساب</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Edit Dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل صلاحيات — {permTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => setAllPerms('full')} className="flex-1">منح كل الصلاحيات</Button>
              <Button size="sm" variant="outline" onClick={() => setAllPerms('none')} className="flex-1">إلغاء كل الصلاحيات</Button>
            </div>
            {SECTIONS.map(s => (
              <div key={s.key} className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.label}</span>
                <select
                  value={permissions[s.key] || 'none'}
                  onChange={e => setPermissions(p => ({ ...p, [s.key]: e.target.value }))}
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                >
                  {Object.entries(PERM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <Button onClick={handleSavePerms} className="w-full mt-4">حفظ الصلاحيات</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}