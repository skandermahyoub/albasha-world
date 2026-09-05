import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2, Eye, Tag, X, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import AIImageField from '@/components/admin/AIImageField';

const BLOG_CATEGORIES = [
  { value: 'shisha', label: '🚬 شيشة' },
  { value: 'boutique', label: '🎁 بوتيك وهدايا' },
  { value: 'perfume', label: '💧 عطور' },
  { value: 'vape', label: '💨 فيب' },
  { value: 'pets', label: '🐾 حيوانات أليفة' },
  { value: 'tips', label: '💡 نصائح وإرشادات' },
];

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const load = () => base44.entities.BlogPost.list('-created_date', 200).then(setPosts).catch(() => []);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل العنوان');
    if (editing) await base44.entities.BlogPost.update(editing.id, form);
    else await base44.entities.BlogPost.create({ ...form, status: form.status || 'draft', views: 0 });
    toast.success('تم الحفظ'); setOpen(false); setForm({}); setEditing(null); load();
  };

  const openNew = () => { setEditing(null); setForm({ status: 'draft', tags: [] }); setTagInput(''); setOpen(true); };
  const openEdit = (post) => { setEditing(post); setForm({ ...post }); setTagInput(''); setOpen(true); };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const tags = form.tags || [];
    if (!tags.includes(t)) setForm(f => ({ ...f, tags: [...(f.tags || []), t] }));
    setTagInput('');
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: (f.tags || []).filter(t => t !== tag) }));

  const filtered = filterCat === 'all' ? posts : posts.filter(p => p.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">مدونة المتجر</h1>
          <p className="text-sm text-muted-foreground">{posts.length} مقال | {posts.filter(p => p.status === 'published').length} منشور</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" /> مقال جديد</Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          الكل ({posts.length})
        </button>
        {BLOG_CATEGORIES.map(c => {
          const count = posts.filter(p => p.category === c.value).length;
          return (
            <button key={c.value} onClick={() => setFilterCat(c.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${filterCat === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(post => (
          <div key={post.id} className="bg-card rounded-xl border border-border/50 overflow-hidden flex gap-3 p-3 hover:shadow-md transition-all">
            {post.image && (
              <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0">
                <img src={post.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className="font-bold text-sm leading-tight line-clamp-2">{post.title}</p>
                <div className="flex shrink-0">
                  <Link to={`/blog/${post.id}`} target="_blank">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(post)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { await base44.entities.BlogPost.delete(post.id); load(); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {post.status === 'published'
                  ? <span className="flex items-center gap-0.5 text-[10px] text-orange-600 font-medium"><CheckCircle className="w-3 h-3" /> منشور</span>
                  : <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> مسودة</span>}
                {post.category && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{BLOG_CATEGORIES.find(c => c.value === post.category)?.label || post.category}</span>}
                {post.tags?.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-10">لا توجد مقالات</p>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-2xl mx-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'تعديل المقال' : 'مقال جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4">

            {/* Title */}
            <Input placeholder="العنوان الرئيسي *" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="العنوان الفرعي" value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />

            {/* Category */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">التصنيف</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">-- اختر التصنيف --</option>
                {BLOG_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">الوسوم</label>
              <div className="flex gap-2">
                <Input placeholder="أضف وسم واضغط Enter" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="flex-1" />
                <Button variant="outline" size="sm" onClick={addTag}><Tag className="w-4 h-4" /></Button>
              </div>
              {(form.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(form.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">المحتوى (يدعم Markdown)</label>
              <Textarea placeholder="اكتب محتوى المقال..." value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={12} className="font-mono text-sm" />
            </div>

            <AIImageField
              value={form.image}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
              context={{ type: 'slide', title: form.title, subtitle: form.subtitle }}
              label="صورة المقال"
              aspect="h-44"
            />

            {/* Status */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">الحالة</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.status || 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="draft">📝 مسودة</option>
                <option value="published">✅ منشور</option>
              </select>
            </div>

            <Button onClick={handleSave} className="w-full h-11">حفظ المقال</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}