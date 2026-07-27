import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import AIImageField from '@/components/admin/AIImageField';

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});


  const load = () => base44.entities.Brand.list('sort_order').then(setBrands).catch(() => []);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name) return toast.error('أدخل اسم العلامة');
    if (editing) await base44.entities.Brand.update(editing.id, form);
    else await base44.entities.Brand.create({ ...form, is_active: true });
    toast.success('تم الحفظ');
    setOpen(false); setForm({}); setEditing(null); load();
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">العلامات التجارية</h1>
        <Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }}><Plus className="w-4 h-4 ml-2" /> إضافة</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {brands.map(b => (
          <div key={b.id} className="bg-card rounded-xl p-4 border border-border/50 text-center">
            {b.logo ? <img src={b.logo} alt={b.name} className="w-16 h-16 object-contain mx-auto mb-2" /> : <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold text-xl">{b.name?.[0]}</div>}
            <p className="font-bold text-sm">{b.name}</p>
            <div className="flex gap-1 justify-center mt-2">
              <Button variant="ghost" size="icon" onClick={() => { setEditing(b); setForm(b); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => { await base44.entities.Brand.delete(b.id); load(); }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'تعديل العلامة' : 'إضافة علامة تجارية'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم العلامة التجارية" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <AIImageField
              value={form.logo}
              onChange={(url) => setForm(f => ({ ...f, logo: url }))}
              context={{ type: 'logo', title: form.name }}
              label="شعار العلامة التجارية"
              aspect="h-28"
            />
            <Input type="number" placeholder="الترتيب" value={form.sort_order || 0} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} />
            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}