import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Play, Image as ImageIcon, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import AIImageField from '@/components/admin/AIImageField';

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [coverLoading, setCoverLoading] = useState(false);

  const load = () => base44.entities.VideoGallery.list('sort_order').catch(() => []).then(setVideos);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.video_url) return toast.error('أدخل العنوان والرابط');
    if (editing) {
      await base44.entities.VideoGallery.update(editing.id, form);
      toast.success('تم التحديث');
    } else {
      await base44.entities.VideoGallery.create({ ...form, is_active: true });
      toast.success('تمت الإضافة');
    }
    setOpen(false); setForm({}); setEditing(null);
    load();
  };

  const openEdit = (v) => { setEditing(v); setForm(v); setOpen(true); };
  const openAdd = () => { setEditing(null); setForm({ is_active: true }); setOpen(true); };
  const handleDelete = async (id) => {
    if (!confirm('حذف الفيديو؟')) return;
    await base44.entities.VideoGallery.delete(id);
    load();
  };

  const generateCover = async () => {
    if (!form.title) return toast.error('أدخل عنوان الفيديو أولاً');
    setCoverLoading(true);
    const { url } = await base44.integrations.Core.GenerateImage({
      prompt: `Video thumbnail cover image for "${form.title}", luxury dark theme, elegant design, Arabic store, high quality`,
    });
    setForm(f => ({ ...f, cover_image: url }));
    setCoverLoading(false);
  };

  const getYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n]+)/);
    return match ? match[1] : null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">معرض الفيديو ({videos.length})</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 ml-2" /> إضافة فيديو</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(v => {
          const ytId = getYoutubeId(v.video_url || '');
          const thumb = v.cover_image || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
          return (
            <div key={v.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="relative aspect-video bg-secondary">
                {thumb ? (
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <Button size="icon" variant="secondary" className="w-7 h-7" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="destructive" className="w-7 h-7" onClick={() => handleDelete(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm truncate">{v.title}</p>
                {v.category && <p className="text-xs text-muted-foreground">{v.category}</p>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.is_active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {v.is_active ? 'منشور' : 'مخفي'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل فيديو' : 'إضافة فيديو'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="عنوان الفيديو" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="رابط الفيديو (يوتيوب أو رابط مباشر)" value={form.video_url || ''} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
            <Textarea placeholder="الوصف" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <Input placeholder="التصنيف" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input type="number" placeholder="الترتيب" value={form.sort_order ?? ''} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} />

            <AIImageField
              value={form.cover_image}
              onChange={(url) => setForm(f => ({ ...f, cover_image: url }))}
              context={{ type: 'slide', title: form.title }}
              label="غلاف الفيديو"
              aspect="h-28"
            />

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active !== false} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm">نشر الفيديو</span>
            </div>
            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}