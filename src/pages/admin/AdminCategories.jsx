import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Store, FolderOpen, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { getStores, getStoreColor } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';
import AIImageField from '@/components/admin/AIImageField';

export default function AdminCategories() {
  const { settings } = useStoreSettings();
  const themeConfig = settings?.theme_config || {};
  const STORES = getStores(themeConfig);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ name: '', store_key: '', parent_id: '', sort_order: 0, description: '', is_active: true });

  const load = () => base44.entities.Category.list('sort_order').then(setCategories).catch(() => []);
  useEffect(() => { load(); }, []);

  // Sub-categories grouped by parent (store_key)
  const subsByStore = {};
  categories.forEach(cat => {
    if (cat.parent_id) {
      if (!subsByStore[cat.parent_id]) subsByStore[cat.parent_id] = [];
      subsByStore[cat.parent_id].push(cat);
    }
  });

  // Top-level cats per store (no parent_id but has store_key match to root)
  // We treat MAIN_STORES as virtual roots; actual DB categories with no parent_id = sub of their store_key
  const subsByStoreKey = {};
  categories.filter(c => !c.parent_id).forEach(cat => {
    const key = cat.store_key || 'other';
    if (!subsByStoreKey[key]) subsByStoreKey[key] = [];
    subsByStoreKey[key].push(cat);
  });

  const openAdd = (storeKey = '') => {
    setEditing(null);
    setForm({ name: '', store_key: storeKey, parent_id: '', sort_order: 0, description: '', is_active: true });
    setOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ ...cat });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('أدخل اسم التصنيف');
    if (editing) await base44.entities.Category.update(editing.id, form);
    else await base44.entities.Category.create(form);
    toast.success(editing ? 'تم التحديث' : 'تم الإضافة');
    setOpen(false); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا التصنيف؟ سيتم حذف التصنيفات الفرعية أيضاً')) return;
    // delete subs first
    categories.filter(c => c.parent_id === id).forEach(c => base44.entities.Category.delete(c.id));
    await base44.entities.Category.delete(id);
    toast.success('تم الحذف'); load();
  };

  const toggleExpand = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  // Get sub-subcategories (children of a category that itself has parent)
  const childrenOf = (parentId) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">التصنيفات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة تصنيفات {settings?.store_name || 'المتجر'} — كل نشاط له أقسامه الخاصة</p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-3 text-sm">
            💡 <strong>ملاحظة:</strong> التصنيفات التي تحتوي على صورة تظهر تلقائياً في قسم "تصفّح حسب التصنيف" بالصفحة الرئيسية.
          </div>
        </div>
        <Button onClick={() => openAdd()}><Plus className="w-4 h-4 ml-2" /> تصنيف جديد</Button>
      </div>

      {/* Store Sections */}
      <div className="space-y-4">
        {STORES.map(store => {
          const storeCats = subsByStoreKey[store.key] || [];
          const isExpanded = expanded[store.key] !== false; // default open
          const color = store.color || getStoreColor(store.key);

          return (
            <div key={store.key} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              {/* Store Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border/30">
                <button
                  className="flex items-center gap-2 flex-1"
                  onClick={() => toggleExpand(store.key)}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '1A', border: `1px solid ${color}33` }}>
                    <store.icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="font-heading font-bold text-base" style={{ color }}>{store.name}</span>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">{storeCats.length} تصنيف</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground mr-auto" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mr-auto" />}
                </button>
                <Button size="sm" variant="outline" onClick={() => openAdd(store.key)} className="mr-2">
                  <Plus className="w-3.5 h-3.5 ml-1" /> إضافة تصنيف
                </Button>
              </div>

              {isExpanded && (
                <div className="p-3 space-y-2">
                  {storeCats.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد تصنيفات بعد</p>
                  )}
                  {storeCats.map(cat => {
                    const children = childrenOf(cat.id);
                    const catExpanded = expanded[`cat_${cat.id}`] !== false;

                    return (
                      <div key={cat.id} className="border border-border/40 rounded-xl overflow-hidden">
                        {/* Parent Category */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-background hover:bg-accent/30 transition-colors">
                          <button
                            onClick={() => toggleExpand(`cat_${cat.id}`)}
                            className="flex items-center gap-2 flex-1 min-w-0"
                          >
                            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-bold text-sm truncate">{cat.name}</span>
                            {cat.sort_order !== undefined && cat.sort_order !== null && <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">ترتيب: {cat.sort_order}</span>}
                            {children.length > 0 && (
                              <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{children.length}</span>
                            )}
                            {!cat.is_active && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 rounded-full">معطّل</span>}
                            {catExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mr-auto shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mr-auto shrink-0" />}
                          </button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                            setEditing(null);
                            setForm({ name: '', store_key: store.key, parent_id: cat.id, sort_order: 0, description: '', is_active: true });
                            setOpen(true);
                          }}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openEdit(cat)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => handleDelete(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>

                        {/* Sub-Categories */}
                        {catExpanded && children.length > 0 && (
                          <div className="border-t border-border/30 bg-secondary/10">
                            {children.map(sub => (
                              <div key={sub.id} className="flex items-center gap-2 px-4 py-2 border-b border-border/20 last:border-0 hover:bg-accent/20 transition-colors">
                                <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm flex-1 truncate">{sub.name}</span>
                                {!sub.is_active && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 rounded-full">معطّل</span>}
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(sub)}><Pencil className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(sub.id)}><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل التصنيف' : 'إضافة تصنيف'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم التصنيف *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="الوصف (اختياري)" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">النشاط الرئيسي</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.store_key || ''} onChange={e => setForm(f => ({ ...f, store_key: e.target.value }))}>
                <option value="">-- اختر النشاط --</option>
                {STORES.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
            </div>

            {form.store_key && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">تصنيف أب (اختياري)</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.parent_id || ''} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}>
                  <option value="">-- تصنيف رئيسي --</option>
                  {(subsByStoreKey[form.store_key] || []).filter(c => c.id !== editing?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <AIImageField
              value={form.image}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
              context={{ type: 'category', title: form.name }}
              label="صورة التصنيف"
              aspect="h-32"
            />

            <Input type="number" placeholder="الترتيب" value={form.sort_order || 0} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} />

            <div className="flex items-center justify-between">
              <span className="text-sm">مفعّل</span>
              <Switch checked={form.is_active !== false} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>

            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}