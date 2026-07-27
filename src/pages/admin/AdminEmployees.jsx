import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, User2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ROLE_LABELS = { manager: 'مدير', sales: 'مبيعات', support: 'دعم', warehouse: 'مستودع' };
const STORE_LABELS = { shisha: 'شيشة', boutique: 'بوتيك', perfume: 'عطور', vape: 'فيب', pets: 'حيوانات أليفة', all: 'جميع الأقسام' };

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = () => base44.entities.Employee.list('-created_date', 100).catch(() => []).then(setEmployees);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.role) return toast.error('أدخل الاسم والدور');
    if (editing) {
      await base44.entities.Employee.update(editing.id, form);
      toast.success('تم تحديث الموظف');
    } else {
      await base44.entities.Employee.create({ ...form, is_active: true });
      toast.success('تم إضافة الموظف');
    }
    setOpen(false); setForm({}); setEditing(null);
    load();
  };

  const openEdit = (emp) => { setEditing(emp); setForm(emp); setOpen(true); };
  const openAdd = () => { setEditing(null); setForm({ role: 'sales', store_key: 'all', is_active: true }); setOpen(true); };
  const handleDelete = async (id) => {
    if (!confirm('حذف الموظف؟')) return;
    await base44.entities.Employee.delete(id);
    toast.success('تم الحذف');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">إدارة الموظفين ({employees.length})</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 ml-2" /> إضافة موظف</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center">
                  <User2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[emp.role] || emp.role}</Badge>
              <Badge variant="outline" className="text-[10px]">{STORE_LABELS[emp.store_key] || emp.store_key}</Badge>
              <Badge className={`text-[10px] ${emp.is_active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                {emp.is_active ? 'مفعّل' : 'موقوف'}
              </Badge>
            </div>
            {emp.phone && <p className="text-xs text-muted-foreground mt-2">📱 {emp.phone}</p>}
            {emp.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{emp.notes}</p>}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل موظف' : 'إضافة موظف'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="الاسم الكامل" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="البريد الإلكتروني" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder="رقم الهاتف" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Select value={form.role || 'sales'} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue placeholder="الدور" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="sales">مبيعات</SelectItem>
                <SelectItem value="support">دعم عملاء</SelectItem>
                <SelectItem value="warehouse">مستودع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.store_key || 'all'} onValueChange={v => setForm(f => ({ ...f, store_key: v }))}>
              <SelectTrigger><SelectValue placeholder="المتجر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                <SelectItem value="shisha">شيشة</SelectItem>
                <SelectItem value="boutique">بوتيك</SelectItem>
                <SelectItem value="perfume">عطور</SelectItem>
                <SelectItem value="vape">فيب</SelectItem>
                <SelectItem value="pets">حيوانات أليفة</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="ملاحظات" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active !== false} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm">موظف مفعّل</span>
            </div>
            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}