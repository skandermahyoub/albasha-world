import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Package, Tag, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import AIImageField from '@/components/admin/AIImageField';
import { getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function AdminBundles() {
  const { settings } = useStoreSettings();
  const STORES = getStores(settings?.theme_config || {});
  const STORE_LABELS = Object.fromEntries(STORES.map(s => [s.key, s.name]));
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ is_active: true, show_on_home: false, product_ids: [] });
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [b, p] = await Promise.all([
      base44.entities.Bundle.list('-created_date', 100).catch(() => []),
      base44.entities.Product.list('-created_date', 500).catch(() => []),
    ]);
    setBundles(b);
    setProducts(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ is_active: true, show_on_home: false, product_ids: [], title: '', description: '', bundle_price: '', image: '' });
    setSearch('');
    setOpen(true);
  };

  const openEdit = (bundle) => {
    setEditing(bundle);
    setForm({ ...bundle, product_ids: bundle.product_ids || [] });
    setOpen(true);
  };

  const toggleProduct = (productId) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(productId)
        ? f.product_ids.filter(id => id !== productId)
        : [...f.product_ids, productId],
    }));
  };

  const selectedProducts = (form.product_ids || []).map(id => products.find(p => p.id === id)).filter(Boolean);
  const originalPrice = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const bundlePrice = parseFloat(form.bundle_price) || 0;
  const discountPercent = originalPrice > 0 && bundlePrice > 0
    ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 100)
    : 0;

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل اسم الباقة');
    if (!form.product_ids || form.product_ids.length < 2) return toast.error('اختر منتجين على الأقل');
    if (!form.bundle_price || form.bundle_price <= 0) return toast.error('أدخل سعر الباقة');

    const payload = {
      title: form.title,
      description: form.description || '',
      image: form.image || '',
      product_ids: form.product_ids,
      original_price: originalPrice,
      bundle_price: bundlePrice,
      discount_percent: discountPercent,
      is_active: form.is_active ?? true,
      show_on_home: form.show_on_home ?? false,
    };

    if (editing) {
      await base44.entities.Bundle.update(editing.id, payload);
      toast.success('تم تحديث الباقة');
    } else {
      await base44.entities.Bundle.create(payload);
      toast.success('تم إنشاء الباقة');
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذه الباقة؟')) return;
    await base44.entities.Bundle.delete(id);
    toast.success('تم الحذف');
    load();
  };

  const filteredProducts = products.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-2xl">الباقات ({bundles.length})</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 ml-2" /> إنشاء باقة</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد باقات بعد</p>
          <p className="text-xs mt-1">اجمع منتجات في عرض واحد بسعر مخفض</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map(bundle => (
            <div key={bundle.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {bundle.image && <img src={bundle.image} alt="" className="w-full h-32 object-cover" />}
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-sm">{bundle.title}</h3>
                  {bundle.discount_percent > 0 && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">-{bundle.discount_percent}%</span>
                  )}
                </div>
                {bundle.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{bundle.description}</p>}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">${bundle.bundle_price}</span>
                  {bundle.original_price && bundle.original_price > bundle.bundle_price && (
                    <span className="text-xs text-muted-foreground line-through">${bundle.original_price}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded">{(bundle.product_ids || []).length} منتجات</span>
                  {bundle.show_on_home && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">في الرئيسية</span>}
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(bundle)}><Pencil className="w-3 h-3 ml-1" /> تعديل</Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(bundle.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="اسم الباقة *" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="وصف الباقة" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />

            <AIImageField
              value={form.image}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
              context={{ type: 'bundle', title: form.title }}
              label="صورة الباقة"
              aspect="h-32"
            />

            {/* Product Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">المنتجات المختارة ({form.product_ids?.length || 0})</span>
                {selectedProducts.length > 0 && (
                  <span className="text-xs text-muted-foreground">السعر الأصلي: <span className="font-bold text-foreground">${originalPrice.toFixed(0)}</span></span>
                )}
              </div>

              {/* Selected products chips */}
              {selectedProducts.length > 0 && (
                <div className="flex gap-1 flex-wrap p-2 bg-secondary/30 rounded-lg">
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-1 bg-card rounded-full pl-2 pr-1 py-0.5 border border-border/50">
                      {p.image && <img src={p.image} alt="" className="w-5 h-5 rounded-full object-cover" />}
                      <span className="text-[10px] font-medium">{p.title}</span>
                      <button onClick={() => toggleProduct(p.id)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ابحث عن منتجات..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
              </div>

              {/* Product list */}
              <div className="max-h-48 overflow-y-auto space-y-1 bg-secondary/20 rounded-lg p-2">
                {filteredProducts.map(p => {
                  const isSelected = form.product_ids?.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary border border-transparent'}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground">{STORE_LABELS[p.store_key] || p.store_key}</p>
                      </div>
                      <span className="text-xs font-bold text-primary">${p.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">السعر الأصلي (تلقائي)</label>
                <Input value={originalPrice.toFixed(0)} disabled className="bg-secondary/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">سعر الباقة *</label>
                <Input type="number" placeholder="0" value={form.bundle_price || ''} onChange={e => setForm(f => ({ ...f, bundle_price: parseFloat(e.target.value) }))} />
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="flex items-center justify-center gap-2 bg-primary/10 rounded-lg p-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">خصم {discountPercent}% — توفير ${(originalPrice - bundlePrice).toFixed(0)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><span className="text-sm">مفعّلة</span></div>
              <div className="flex items-center gap-2"><Switch checked={form.show_on_home ?? false} onCheckedChange={v => setForm(f => ({ ...f, show_on_home: v }))} /><span className="text-sm">عرض بالرئيسية</span></div>
            </div>

            <Button onClick={handleSave} className="w-full">{editing ? 'تحديث الباقة' : 'إنشاء الباقة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}