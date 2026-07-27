import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Wand2, Image as ImageIcon, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import AIImageField from '@/components/admin/AIImageField';

export default function AdminGenericList({ entityName, title, fields = [], aiImagePrompt, imageType = 'product' }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [generating, setGenerating] = useState(false);

  const entity = base44.entities[entityName];
  const load = () => entity.list('-created_date', 100).then(setItems).catch(() => []);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await entity.update(editing.id, form);
    else await entity.create(form);
    toast.success(editing ? 'تم التحديث' : 'تم الإضافة');
    setOpen(false); setForm({}); setEditing(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد؟')) return;
    await entity.delete(id);
    toast.success('تم الحذف'); load();
  };

  const handleUpload = async (e, fieldKey) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      toast.info('جاري رفع الصورة...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, [fieldKey]: file_url }));
      toast.success('تم رفع الصورة');
    } catch (err) {
      toast.error('فشل رفع الصورة - تأكد من اشتراك Builder+');
    }
  };

  const generateImage = async (fieldKey) => {
    setGenerating(true);
    try {
      toast.info('جاري توليد الصورة...');
      const prompt = typeof aiImagePrompt === 'function' ? aiImagePrompt(form) : aiImagePrompt || `Professional image for ${form.title || form.name || entityName}`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      setForm(f => ({ ...f, [fieldKey]: url }));
      toast.success('تم توليد الصورة');
    } catch (err) {
      if (err?.message?.includes('limit')) {
        toast.error('انتهى رصيد التكاملات لهذا الشهر - يرجى ترقية الخطة');
      } else {
        toast.error('فشل توليد الصورة - تأكد من اشتراك Builder+');
      }
    }
    setGenerating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">{title}</h1>
        <Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }}><Plus className="w-4 h-4 ml-2" /> إضافة</Button>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-card rounded-lg p-3 border border-border/50 flex items-center gap-2 min-w-0 overflow-hidden">
            {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
            {item.logo && <img src={item.logo} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-bold text-sm truncate">{item.title || item.name || item.text || item.comment}</p>
              <p className="text-xs text-muted-foreground truncate">{item.subtitle || item.status || ''} {item.sort_order !== undefined && item.sort_order !== null && ` · ترتيب: ${item.sort_order}`}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm(item); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد عناصر</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'تعديل' : 'إضافة'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fields.map(field => {
              if (field.type === 'image') {
                return (
                  <AIImageField
                    key={field.key}
                    value={form[field.key]}
                    onChange={(url) => setForm(f => ({ ...f, [field.key]: url }))}
                    context={{ type: imageType, title: form.title || form.name }}
                    label={field.label}
                    aspect="max-h-64"
                  />
                );
              }
              if (field.type === 'images') {
                const arr = form[field.key] || [];
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm text-muted-foreground">{field.label}</label>
                    {arr.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {arr.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setForm(f => ({ ...f, [field.key]: (f[field.key] || []).filter((_, idx) => idx !== i) }))} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="block w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                      <input type="file" accept="image/*" multiple onChange={async (e) => {
                        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/') && f.size < 5 * 1024 * 1024);
                        if (!files.length) return toast.error('صور غير صالحة (أقل من 5 ميجابايت)');
                        const urls = [];
                        for (const file of files) {
                          try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); urls.push(file_url); } catch {}
                        }
                        setForm(f => ({ ...f, [field.key]: [...(f[field.key] || []), ...urls] }));
                        toast.success(`تم رفع ${urls.length} صورة`);
                      }} className="hidden" />
                      <ImageIcon className="w-4 h-4 ml-2" /> رفع صور متعددة
                    </label>
                  </div>
                );
              }
              if (field.type === 'textarea') {
                return <div key={field.key}><label className="text-sm text-muted-foreground">{field.label}</label><Textarea value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} /></div>;
              }
              if (field.type === 'toggle') {
                return (
                  <div key={field.key} className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">{field.label}</label>
                    <Switch checked={form[field.key] || false} onCheckedChange={v => setForm(f => ({ ...f, [field.key]: v }))} />
                  </div>
                );
              }
              if (field.type === 'select') {
                return (
                  <div key={field.key}>
                    <label className="text-sm text-muted-foreground">{field.label}</label>
                    <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}>
                      <option value="">اختر</option>
                      {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                );
              }
              return (
                <div key={field.key}>
                  <label className="text-sm text-muted-foreground">{field.label}</label>
                  <Input type={field.type || 'text'} value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
                </div>
              );
            })}
            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}