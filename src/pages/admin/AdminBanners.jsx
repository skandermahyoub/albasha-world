import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AIImageField from '@/components/admin/AIImageField';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [genLoading, setGenLoading] = useState(false);

  const load = () => base44.entities.AdvertBanner.list('sort_order').catch(() => []).then(setBanners);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل العنوان');
    if (editing) {
      await base44.entities.AdvertBanner.update(editing.id, form);
      toast.success('تم التحديث');
    } else {
      await base44.entities.AdvertBanner.create({ ...form, is_active: true, sort_order: banners.length });
      toast.success('تمت الإضافة');
    }
    setOpen(false); setForm({}); setEditing(null);
    load();
  };

  const openEdit = (b) => { setEditing(b); setForm(b); setOpen(true); };
  const openAdd = () => { setEditing(null); setForm({ is_active: true }); setOpen(true); };
  const handleDelete = async (id) => {
    if (!confirm('حذف البانر؟')) return;
    await base44.entities.AdvertBanner.delete(id);
    load();
  };

  const generateImage = async () => {
    if (!form.title) return toast.error('أدخل العنوان أولاً');
    setGenLoading(true);
    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: `Luxury Arabic e-commerce promotional banner for "${form.title}". Elegant dark purple background, golden accents, Arabic luxury aesthetic, professional advertisement, high quality`,
    });
    setForm(f => ({ ...f, image: url }));
    setGenLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image: file_url }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">البانرات الإعلانية ({banners.length}/4)</h1>
        <Button onClick={openAdd} disabled={banners.length >= 4}>
          <Plus className="w-4 h-4 ml-2" /> إضافة بانر
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">يمكن إضافة حد أقصى 4 بانرات تظهر في الصفحة الرئيسية</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map(b => (
          <div key={b.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="relative aspect-[16/7]">
              {b.image ? (
                <img src={b.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-1">
                <Button size="icon" variant="secondary" className="w-7 h-7" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="destructive" className="w-7 h-7" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm">{b.title}</p>
              {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.is_active ? 'مفعّل' : 'مخفي'}
                </span>
                {b.button_text && <span className="text-xs text-primary">{b.button_text} ←</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل البانر' : 'إضافة بانر'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="العنوان الرئيسي" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="العنوان الفرعي" value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            <Input placeholder="نص الزر (اختياري)" value={form.button_text || ''} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} />
            <Input placeholder="رابط الزر" value={form.button_link || ''} onChange={e => setForm(f => ({ ...f, button_link: e.target.value }))} />
            <Input type="number" placeholder="الترتيب" value={form.sort_order ?? ''} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} />

            <AIImageField
              value={form.image}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
              context={{ type: 'banner', title: form.title, subtitle: form.subtitle }}
              label="صورة البانر"
              aspect="h-32"
            />

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active !== false} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm">نشر البانر</span>
            </div>

            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}