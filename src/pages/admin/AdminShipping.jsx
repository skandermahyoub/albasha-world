import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Plus, Pencil, Trash2, Ship, Anchor, Loader2, Truck, Gift, MapPinPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/lib/useStoreSettings';
import useCurrency from '@/lib/useCurrency';
import { base44 as base44Client } from '@/api/base44Client';

const ZONE_CURRENCIES = {
  USD: { label: 'دولار أمريكي', symbol: '$' },
  SAR: { label: 'ريال سعودي', symbol: 'ر.س' },
  YER_OLD: { label: 'ريال يمني (قديم)', symbol: 'ر.ق' },
  YER_NEW: { label: 'ريال يمني (جديد)', symbol: 'ر.ج' },
  AED: { label: 'درهم إماراتي', symbol: 'د.إ' },
};

const formatZonePrice = (fee, zoneCurrency) => {
  const c = ZONE_CURRENCIES[zoneCurrency] || ZONE_CURRENCIES.YER_NEW;
  return `${Number(fee || 0).toLocaleString('en-US')} ${c.symbol}`;
};

export default function AdminShipping() {
  const { settings, settingsId, reloadSettings } = useStoreSettings();
  const currency = useCurrency(settings);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ zone_name: '', delivery_fee: '', currency: 'YER_NEW', estimated_hours: '', estimated_time_text: '', is_active: true, sort_order: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  // Free shipping settings
  const [freeEnabled, setFreeEnabled] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState('');
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [originName, setOriginName] = useState('خور مكسر');
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ShippingZone.list('sort_order');
      setZones(data);
    } catch { toast.error('تعذر تحميل مناطق الشحن'); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (settings) {
      setFreeEnabled(settings.free_shipping_enabled || false);
      setFreeThreshold(settings.free_shipping_threshold || '');
      setInsuranceEnabled(settings.shipping_insurance_enabled !== false);
      setOriginName(settings.shipping_origin_name || 'خور مكسر');
    }
  }, [settings]);

  const openNew = () => { setEditing(null); setForm({ zone_name: '', delivery_fee: '', currency: 'YER_NEW', estimated_hours: '', estimated_time_text: '', is_active: true, sort_order: 0, notes: '' }); setOpen(true); };
  const openEdit = (z) => { setEditing(z); setForm({ zone_name: z.zone_name, delivery_fee: z.delivery_fee, currency: z.currency || 'YER_NEW', estimated_hours: z.estimated_hours || '', estimated_time_text: z.estimated_time_text || '', is_active: z.is_active !== false, sort_order: z.sort_order || 0, notes: z.notes || '' }); setOpen(true); };

  const save = async () => {
    if (!form.zone_name.trim()) return toast.error('أدخل اسم المنطقة');
    if (form.delivery_fee === '' || isNaN(form.delivery_fee)) return toast.error('أدخل رسوم شحن صحيحة');
    setSaving(true);
    try {
      const payload = {
        zone_name: form.zone_name.trim(),
        delivery_fee: Number(form.delivery_fee),
        currency: form.currency,
        estimated_hours: form.estimated_hours.trim(),
        estimated_time_text: form.estimated_time_text.trim(),
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        notes: form.notes.trim(),
      };
      if (editing) await base44.entities.ShippingZone.update(editing.id, payload);
      else await base44.entities.ShippingZone.create(payload);
      toast.success(editing ? 'تم تحديث المنطقة' : 'تمت إضافة المنطقة');
      setOpen(false);
      load();
    } catch { toast.error('فشل الحفظ'); }
    setSaving(false);
  };

  const remove = async (z) => {
    if (!confirm(`حذف منطقة "${z.zone_name}"؟`)) return;
    try { await base44.entities.ShippingZone.delete(z.id); toast.success('تم الحذف'); load(); }
    catch { toast.error('فشل الحذف'); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        free_shipping_enabled: freeEnabled,
        free_shipping_threshold: Number(freeThreshold) || 0,
        shipping_insurance_enabled: insuranceEnabled,
        shipping_origin_name: originName.trim() || 'خور مكسر',
      };
      if (settingsId) {
        await base44Client.entities.StoreSettings.update(settingsId, payload);
      } else {
        await base44Client.entities.StoreSettings.create({ store_name: 'عالم الباشا للتسوق', ...payload });
      }
      await reloadSettings();
      toast.success('تم حفظ إعدادات الشحن');
    } catch { toast.error('فشل حفظ الإعدادات'); }
    setSavingSettings(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">مناطق الشحن والتوصيل</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة نقاط الوصول ورسوم التوصيل وحد التوصيل المجاني</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> إضافة منطقة</Button>
      </div>

      {/* Free Shipping + Settings Section */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-heading font-bold flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> إعدادات الشحن العامة</h3>
        
        {/* Origin point */}
        <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3 border border-primary/20">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Anchor className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">نقطة الانطلاق للشحن</p>
            <Input value={originName} onChange={e => setOriginName(e.target.value)} placeholder="خور مكسر" className="mt-1 max-w-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Free shipping toggle */}
          <div className="bg-secondary/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold flex items-center gap-1.5"><Gift className="w-4 h-4 text-green-600" /> التوصيل المجاني</span>
              <Switch checked={freeEnabled} onCheckedChange={setFreeEnabled} />
            </div>
            <p className="text-[11px] text-muted-foreground">تفعيل توصيل مجاني للطلبات التي تتجاوز حدّاً معيناً</p>
          </div>

          {/* Free shipping threshold */}
          <div className="bg-secondary/40 rounded-xl p-3">
            <label className="text-xs font-bold block mb-1">حد التوصيل المجاني (دولار)</label>
            <Input type="number" placeholder="0.00" value={freeThreshold} onChange={e => setFreeThreshold(e.target.value)} disabled={!freeEnabled} />
            <p className="text-[11px] text-muted-foreground mt-1">الطلبات فوق هذا المبلغ = توصيل مجاني</p>
          </div>

          {/* Insurance toggle */}
          <div className="bg-secondary/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold flex items-center gap-1.5"><MapPinPlus className="w-4 h-4 text-blue-600" /> خيار تضمين التوصيل</span>
              <Switch checked={insuranceEnabled} onCheckedChange={setInsuranceEnabled} />
            </div>
            <p className="text-[11px] text-muted-foreground">إظهار خيار للعميل لتضمين سعر التوصيل بالفاتورة أو دفعه عند الاستلام</p>
          </div>
        </div>

        <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
          {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ إعدادات الشحن
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : zones.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-heading font-bold">لا توجد مناطق شحن بعد</p>
          <p className="text-sm text-muted-foreground mt-1">أضف أول منطقة شحن ليتمكن العملاء من اختيارها عند إتمام الطلب</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map(z => (
            <div key={z.id} className="glass-card rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-primary" /></div>
                  <h3 className="font-heading font-bold text-sm truncate">{z.zone_name}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(z)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading font-black text-xl text-primary">{Number(z.delivery_fee).toLocaleString('en-US')}</span>
                <span className="text-xs text-muted-foreground">{ZONE_CURRENCIES[z.currency || 'YER_NEW']?.symbol}</span>
                <span className="text-[10px] text-muted-foreground mr-auto bg-secondary px-2 py-0.5 rounded-full">{ZONE_CURRENCIES[z.currency || 'YER_NEW']?.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Ship className="w-3 h-3" /> {z.estimated_hours || 'مدة غير محددة'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${z.is_active !== false ? 'bg-green-500/15 text-green-600' : 'bg-secondary text-muted-foreground'}`}>{z.is_active !== false ? 'مفعّلة' : 'معطّلة'}</span>
              </div>
              {z.estimated_time_text && <p className="text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/30 rounded px-2 py-1">⏱ {z.estimated_time_text}</p>}
              {z.notes && <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2 mt-1">{z.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading"><MapPin className="w-4 h-4 text-primary" /> {editing ? 'تعديل منطقة الشحن' : 'إضافة منطقة شحن جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold mb-1 block">اسم المنطقة / نقطة الوصول *</label>
              <Input placeholder="مثال: المعلا، كريتر، الشيخ عثمان..." value={form.zone_name} onChange={e => setForm(f => ({ ...f, zone_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1 block">رسوم الشحن *</label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.delivery_fee} onChange={e => setForm(f => ({ ...f, delivery_fee: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">عملة الرسوم</label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ZONE_CURRENCIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">مدة التوصيل المتوقعة</label>
              <Input placeholder="مثال: 24 ساعة، يومين..." value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">وقت الوصول المتوقع (وصف حر - اختياري)</label>
              <Input placeholder="مثال: يصل خلال ساعتين من نقطة الانطلاق" value={form.estimated_time_text} onChange={e => setForm(f => ({ ...f, estimated_time_text: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-bold mb-1 block">الترتيب</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2">
                <span className="text-xs font-bold">مفعّلة</span>
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">ملاحظات</label>
              <Textarea rows={2} placeholder="ملاحظات اختيارية..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'حفظ التعديلات' : 'إضافة المنطقة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}