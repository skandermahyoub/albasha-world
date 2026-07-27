import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Copy, Ticket, RefreshCw, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function AdminCoupons() {
  const { settings } = useStoreSettings();
  const STORES = getStores(settings?.theme_config || {}).map(s => ({ ...s, label: s.name }));
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ is_active: true, discount_type: 'percentage' });

  const load = async () => {
    setLoading(true);
    const c = await base44.entities.Coupon.list('-created_date', 200).catch(() => []);
    setCoupons(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ is_active: true, discount_type: 'percentage', code: '', store_key: '', discount_value: '', max_uses: '', valid_from: '', valid_until: '', min_order_value: '', description: '' });
    setOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm(coupon);
    setOpen(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, code }));
  };

  const handleSave = async () => {
    if (!form.code) return toast.error('أدخل كود الخصم');
    if (!form.store_key) return toast.error('اختر المتجر');
    if (!form.discount_value || form.discount_value <= 0) return toast.error('أدخل قيمة الخصم');

    const payload = {
      code: form.code.toUpperCase(),
      store_key: form.store_key,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : 0,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active ?? true,
      description: form.description || '',
    };

    if (editing) {
      await base44.entities.Coupon.update(editing.id, payload);
      toast.success('تم تحديث الكوبون');
    } else {
      await base44.entities.Coupon.create({ ...payload, used_count: 0 });
      toast.success('تم إنشاء الكوبون');
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا الكوبون؟')) return;
    await base44.entities.Coupon.delete(id);
    toast.success('تم الحذف');
    load();
  };

  const toggleActive = async (coupon) => {
    await base44.entities.Coupon.update(coupon.id, { is_active: !coupon.is_active });
    load();
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
  };

  const u = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />
          كوبونات الخصم ({coupons.length})
        </h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 ml-2" /> إنشاء كوبون</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد كوبونات بعد</p>
          <p className="text-xs mt-1">أنشئ كوبونات خصم خاصة بكل فرع لتعزيز المبيعات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => {
            const store = STORES.find(s => s.key === coupon.store_key) || {};
            const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
            const usesLeft = coupon.max_uses > 0 ? coupon.max_uses - (coupon.used_count || 0) : -1;
            return (
              <div key={coupon.id} className={`bg-card rounded-xl p-4 border ${coupon.is_active && !isExpired ? 'border-border/50' : 'border-border/30 opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => copyCode(coupon.code)} className="flex items-center gap-1.5 text-lg font-bold tracking-wider text-primary hover:underline">
                    {coupon.code}
                    <Copy className="w-3 h-3" />
                  </button>
                  <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon)} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {store && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white inline-flex items-center gap-1" style={{ backgroundColor: store.color }}>
                      <store.icon className="w-3 h-3" /> {store.label}
                    </span>
                  )}
                  <span className="text-sm font-bold text-primary">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                  </span>
                  {isExpired && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded">منتهي</span>}
                </div>
                {coupon.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{coupon.description}</p>}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                  <span>استخدام: {coupon.used_count || 0}{coupon.max_uses > 0 ? `/${coupon.max_uses}` : ''}</span>
                  {coupon.valid_until && <span>حتى: {coupon.valid_until}</span>}
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(coupon)}><Pencil className="w-3 h-3 ml-1" /> تعديل</Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(coupon.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'تعديل كوبون' : 'إنشاء كوبون جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">كود الخصم *</label>
              <div className="flex gap-2">
                <Input placeholder="SUMMER2026" value={form.code || ''} onChange={e => u('code', e.target.value.toUpperCase())} className="font-bold tracking-wider" />
                <Button variant="outline" size="icon" onClick={generateCode} title="توليد كود عشوائي"><RefreshCw className="w-4 h-4" /></Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">المتجر *</label>
              <Select value={form.store_key || ''} onValueChange={v => u('store_key', v)}>
                <SelectTrigger><SelectValue placeholder="اختر المتجر" /></SelectTrigger>
                <SelectContent>
                  {STORES.map(s => <SelectItem key={s.key} value={s.key}><span className="inline-flex items-center gap-1"><s.icon className="w-3 h-3" /> {s.label}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">نوع الخصم</label>
                <Select value={form.discount_type || 'percentage'} onValueChange={v => u('discount_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة %</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">قيمة الخصم *</label>
                <Input type="number" placeholder="10" value={form.discount_value || ''} onChange={e => u('discount_value', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">حد أدنى للطلب ($)</label>
                <Input type="number" placeholder="0" value={form.min_order_value || ''} onChange={e => u('min_order_value', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">أقصى استخدامات (0=غير محدود)</label>
                <Input type="number" placeholder="0" value={form.max_uses || ''} onChange={e => u('max_uses', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">تاريخ البداية</label>
                <Input type="date" value={form.valid_from || ''} onChange={e => u('valid_from', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">تاريخ الانتهاء</label>
                <Input type="date" value={form.valid_until || ''} onChange={e => u('valid_until', e.target.value)} />
              </div>
            </div>
            <Input placeholder="وصف الكوبون (اختياري)" value={form.description || ''} onChange={e => u('description', e.target.value)} />
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={v => u('is_active', v)} />
              <span className="text-sm">مفعّل</span>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? 'تحديث الكوبون' : 'إنشاء الكوبون'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}