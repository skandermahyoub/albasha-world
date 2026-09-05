import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminGallery() {
  const [photos, setPhotos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', description: '', image: '' });

  const load = () => base44.entities.Gallery.list('sort_order', 200).then(setPhotos).catch(() => []);
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.image.trim()) return toast.error('أدخل رابط الصورة');
    await base44.entities.Gallery.create({ image: form.image.trim(), title: form.title, category: form.category, description: form.description });
    toast.success('تمت إضافة الصورة');
    setOpen(false);
    setForm({ title: '', category: '', description: '', image: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف الصورة؟')) return;
    await base44.entities.Gallery.delete(id);
    toast.success('تم الحذف');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">معرض الصور ({photos.length})</h1>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 ml-2" /> إضافة صور</Button>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {photos.map(photo => (
          <div key={photo.id} className="break-inside-avoid relative group rounded-xl overflow-hidden">
            <img src={photo.image} alt="" className="w-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <Button variant="destructive" size="icon" onClick={() => handleDelete(photo.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            {photo.title && <p className="text-xs text-center mt-1 truncate text-muted-foreground">{photo.title}</p>}
          </div>
        ))}
        {photos.length === 0 && <p className="text-center text-muted-foreground py-10 col-span-4">لا توجد صور بعد</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md mx-2">
          <DialogHeader><DialogTitle>إضافة صور</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="العنوان (اختياري)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="التصنيف (اختياري)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input placeholder="وصف الصورة (اختياري)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input placeholder="رابط الصورة *" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
            <Button onClick={handleAdd} className="w-full">إضافة الصورة</Button>
            <p className="text-[10px] text-muted-foreground text-center">يتم حفظ الرابط فقط، دون استخدام خدمة رفع أو رصيد تكاملات.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}