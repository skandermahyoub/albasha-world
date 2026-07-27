import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import AIImageField from '@/components/admin/AIImageField';

export default function AdminSlides() {
  const [slides, setSlides] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const load = async () => {
    const [s, p, c] = await Promise.all([
      base44.entities.HeroSlide.list('sort_order').catch(() => []),
      base44.entities.Product.list('-created_date', 200).catch(() => []),
      base44.entities.Category.list('sort_order').catch(() => []),
    ]);
    setSlides(s); setProducts(p); setCategories(c);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل العنوان');
    if (editing) await base44.entities.HeroSlide.update(editing.id, form);
    else await base44.entities.HeroSlide.create({ ...form, is_active: true });
    toast.success(editing ? 'تم التحديث' : 'تم الإضافة');
    setOpen(false); setForm({}); setEditing(null); load();
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    try {
      toast.info('جاري رفع الصورة...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, image: file_url }));
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      toast.error('فشل رفع الصورة - تأكد من اشتراك Builder+');
      console.error('Upload error:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="font-heading font-bold text-2xl">السلايدر ({slides.length})</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }}><Plus className="w-4 h-4 ml-2" /> إضافة شريحة</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slides.map(s => (
          <div key={s.id} className="bg-card rounded-xl overflow-hidden border border-border/50">
            {s.image && <img src={s.image} alt="" className="w-full aspect-video object-cover" />}
            <div className="p-3 flex justify-between items-center">
              <span className="font-bold text-sm truncate">{s.title}</span>
              {s.sort_order !== undefined && s.sort_order !== null && <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full mr-2">ترتيب: {s.sort_order}</span>}
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setForm(s); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => { await base44.entities.HeroSlide.delete(s.id); load(); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'تعديل' : 'إضافة شريحة'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="العنوان الرئيسي" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="العنوان الفرعي" value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            <Input placeholder="نص الزر" value={form.button_text || ''} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} />
            <Input placeholder="رابط الزر (عند اختيار مخصص)" value={form.button_link || ''} onChange={e => setForm(f => ({ ...f, button_link: e.target.value }))} />
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">نوع الرابط</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.link_type || 'custom'} onChange={e => setForm(f => ({ ...f, link_type: e.target.value }))}>
                <option value="custom">رابط مخصص</option>
                <option value="product">منتج</option>
                <option value="category">تصنيف</option>
              </select>
            </div>
            {form.link_type === 'product' && (
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.linked_product_id || ''} onChange={e => setForm(f => ({ ...f, linked_product_id: e.target.value }))}>
                <option value="">اختر المنتج</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
            {form.link_type === 'category' && (
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.linked_category_id || ''} onChange={e => setForm(f => ({ ...f, linked_category_id: e.target.value }))}>
                <option value="">اختر التصنيف</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">تاريخ البداية</label>
                <Input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">تاريخ النهاية</label>
                <Input type="date" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <AIImageField
              value={form.image}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
              context={{ type: 'slide', title: form.title, subtitle: form.subtitle }}
              label="صورة الشريحة"
            />
            <Input type="number" placeholder="الترتيب" value={form.sort_order || 0} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} />
            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}