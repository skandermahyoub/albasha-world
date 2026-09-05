import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Smartphone, Monitor, Headphones, Zap, Tag, Cigarette, Gift, Droplet, Wine, PawPrint, Camera, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';
import { logAction } from '@/lib/auditLog';
import AIImageField from '@/components/admin/AIImageField';

import { getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';

const PAGE_SIZE = 100;
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function AdminProducts() {
  const { settings } = useStoreSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextSkip, setNextSkip] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    await base44.entities.Product.update(product.id, { status: newStatus });
    logAction({
      action: 'update',
      entityType: 'Product',
      entityId: product.id,
      entityName: product.title,
      description: `${newStatus === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المنتج "${product.title}"`,
    });
    toast.success(newStatus === 'active' ? 'تم تفعيل المنتج' : 'تم إلغاء تفعيل المنتج');
    loadData();
  };

  const bulkUpdateStatus = async (status) => {
    await base44.entities.Product.bulkUpdate(selectedIds.map(id => ({ id, status })));
    toast.success(`تم تحديث ${selectedIds.length} منتج`);
    setSelectedIds([]);
    loadData();
  };

  const STORES = getStores(settings?.theme_config || {}).map(s => ({ ...s, label: s.name }));

  const LOW_STOCK_THRESHOLD = 5;

  const loadMeta = async () => {
    const [c, b] = await Promise.all([
      base44.entities.Category.list('sort_order').catch(() => []),
      base44.entities.Brand.list('sort_order').catch(() => []),
    ]);
    setCategories(c);
    setBrands(b.filter(brand => brand.is_active !== false));
  };

  const loadProducts = async ({ append = false, skip = 0, showStockWarning = false } = {}) => {
    if (append) setLoadingMore(true);
    const query = {};
    if (filterStore !== 'all') query.store_key = filterStore;
    if (search.trim()) {
      const term = escapeRegex(search.trim().slice(0, 100));
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { brand: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
      ];
    }
    const rows = await base44.entities.Product.filter(query, '-created_date', PAGE_SIZE + 1, skip).catch(() => []);
    const page = rows.slice(0, PAGE_SIZE);
    setProducts(prev => append ? [...prev, ...page] : page);
    setHasMore(rows.length > PAGE_SIZE);
    setNextSkip(rows.length > PAGE_SIZE ? skip + page.length : null);
    setLoadingMore(false);

    if (showStockWarning) {
      const lowStock = page.filter(prod => prod.stock !== undefined && prod.stock !== null && prod.stock <= LOW_STOCK_THRESHOLD && prod.status === 'active');
      if (lowStock.length > 0) {
        toast.warning(`⚠️ ${lowStock.length} منتج ظاهر بمخزون منخفض (${LOW_STOCK_THRESHOLD} أو أقل)`, {
          duration: 6000,
          description: lowStock.slice(0, 3).map(p => `• ${p.title}: ${p.stock} متبقي`).join('\n'),
        });
      }
    }
  };

  const loadData = () => loadProducts({ append: false, skip: 0 });

  useEffect(() => {
    loadMeta();
    loadProducts({ append: false, skip: 0, showStockWarning: true });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIds([]);
      loadProducts({ append: false, skip: 0 });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filterStore]);

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل اسم المنتج');
    if (!form.price || form.price <= 0) return toast.error('أدخل سعراً صحيحاً (أكبر من صفر)');
    if (!form.store_key) return toast.error('اختر المتجر أولاً');
    if (!form.category_id) return toast.error('اختر التصنيف أولاً');
    const normalizedForm = {
      ...form,
      slug: form.slug || String(form.title).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, ''),
      cost_price: Math.max(0, Number(form.cost_price) || 0),
      stock: Math.max(0, Number(form.stock) || 0),
    };
    if (editing) {
      const oldPrice = editing.price;
      await base44.entities.Product.update(editing.id, normalizedForm);
      // تسجيل في سجل النشاط
      logAction({
        action: oldPrice !== form.price ? 'price_change' : 'update',
        entityType: 'Product',
        entityId: editing.id,
        entityName: normalizedForm.title,
        description: oldPrice !== form.price
          ? `تغيير سعر المنتج "${normalizedForm.title}" من ${oldPrice} إلى ${normalizedForm.price}`
          : `تعديل المنتج "${normalizedForm.title}"`,
        oldValue: editing,
        newValue: normalizedForm,
      });
      toast.success('تم تحديث المنتج');
    } else {
      const created = await base44.entities.Product.create({ ...normalizedForm, status: normalizedForm.status || 'active' });
      logAction({
        action: 'create',
        entityType: 'Product',
        entityId: created?.id,
        entityName: normalizedForm.title,
        description: `إضافة منتج جديد: "${normalizedForm.title}" بسعر ${normalizedForm.price}`,
      });
      toast.success('تم إضافة المنتج');
    }
    setOpen(false);
    setForm({});
    setEditing(null);
    loadData();
  };

  const handleDelete = async (id) => {
    const product = products.find(p => p.id === id);
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    await base44.entities.Product.delete(id);
    logAction({
      action: 'delete',
      entityType: 'Product',
      entityId: id,
      entityName: product?.title || '',
      description: `حذف المنتج "${product?.title || id}"`,
    });
    toast.success('تم حذف المنتج');
    loadData();
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(product);
    setOpen(true);
  };

  const handleBarcodeScan = (code) => {
    setForm(f => ({ ...f, sku: code }));
    setScannerOpen(false);
    toast.success('تم إدخال الباركود في المنتج');
  };

  const filteredProducts = products;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-2xl">المنتجات <span className="text-sm text-muted-foreground">({products.length} معروض)</span></h1>
        <Button onClick={() => { setEditing(null); setForm({ status: 'active', show_price: true, show_cart_btn: true, show_fav_btn: true, show_compare_btn: true }); setOpen(true); }}>
          <Plus className="w-4 h-4 ml-2" /> إضافة منتج
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={filterStore} onValueChange={setFilterStore}>
          <SelectTrigger className="w-40"><SelectValue placeholder="كل النشاطات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل النشاطات</SelectItem>
            {STORES.map(s => (
              <SelectItem key={s.key} value={s.key}>
                <div className="flex items-center gap-2">
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg p-2 mb-2">
          <span className="text-sm font-bold">{selectedIds.length} محدد</span>
          <Button size="sm" variant="default" onClick={() => bulkUpdateStatus('active')}><Eye className="w-3.5 h-3.5 ml-1" /> تفعيل</Button>
          <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('draft')}><EyeOff className="w-3.5 h-3.5 ml-1" /> إخفاء</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>إلغاء التحديد</Button>
        </div>
      )}
      <div className="space-y-2">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-card rounded-lg p-3 border border-border/50 flex items-center gap-3">
            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 shrink-0 accent-primary" />
            <img src={product.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=80'} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{product.title}</h3>
              <p className="text-xs text-muted-foreground">
                {product.price} $ • {STORES.find(s=>s.key===product.store_key)?.label || product.store_key || '—'} • {product.status === 'active' ? 'مفعل' : product.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                {product.stock !== undefined && product.stock !== null && product.stock <= (product.stock_alert_threshold ?? LOW_STOCK_THRESHOLD) && (
                  <span className="mr-2 text-orange-500 font-bold">⚠️ مخزون: {product.stock}</span>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => toggleStatus(product)} title={product.status === 'active' ? 'إلغاء تفعيل' : 'تفعيل'}>
                {product.status === 'active' ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(product)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && nextSkip !== null && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" disabled={loadingMore} onClick={() => loadProducts({ append: true, skip: nextSkip })}>
            {loadingMore ? 'جاري تحميل المزيد...' : 'تحميل 100 منتج إضافي'}
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Store selector first */}
            <Select value={form.store_key || ''} onValueChange={v => setForm(f => ({ ...f, store_key: v, category_id: '' }))}>
              <SelectTrigger><SelectValue placeholder="اختر النشاط أولاً *" /></SelectTrigger>
              <SelectContent>
                {STORES.map(s => (
                  <SelectItem key={s.key} value={s.key}>
                    <div className="flex items-center gap-2">
                      <s.icon className="w-4 h-4" />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.category_id || ''} onValueChange={v => setForm(f => ({ ...f, category_id: v }))} disabled={!form.store_key}>
              <SelectTrigger><SelectValue placeholder={form.store_key ? 'اختر التصنيف *' : 'اختر النشاط أولاً'} /></SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.store_key === form.store_key).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* الحقول المشتركة لكل المتاجر */}
            <Input placeholder="اسم المنتج *" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="وصف مختصر" value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            <Textarea placeholder="الوصف التفصيلي" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="0" step="0.01" placeholder="سعر البيع بالدولار *" value={form.price ?? ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} />
              <Input type="number" min="0" step="0.01" placeholder="تكلفة الوحدة بالدولار" value={form.cost_price ?? ''} onChange={e => setForm(f => ({ ...f, cost_price: parseFloat(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="0" step="0.01" placeholder="السعر القديم بالدولار" value={form.old_price ?? ''} onChange={e => setForm(f => ({ ...f, old_price: parseFloat(e.target.value) }))} />
              <Input placeholder="وحدة البيع (قطعة، علبة، 250 جم...)" value={form.unit || ''} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            {form.old_price && form.old_price > 0 && (
              <Input type="date" placeholder="تاريخ انتهاء الخصم" value={form.discount_end_date || ''} onChange={e => setForm(f => ({ ...f, discount_end_date: e.target.value }))} />
            )}
            <Select value={form.brand_id || 'none'} onValueChange={v => {
              if (v === 'none') return setForm(f => ({ ...f, brand_id: '', brand: '' }));
              const selected = brands.find(b => b.id === v);
              setForm(f => ({ ...f, brand_id: v, brand: selected?.name || '' }));
            }}>
              <SelectTrigger><SelectValue placeholder="العلامة التجارية" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون علامة تجارية</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Slug للرابط (اختياري)" value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
              <Input placeholder="رابط مصدر المنتج (إداري)" value={form.source_url || ''} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="المخزون" value={form.stock ?? ''} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) }))} />
              <Input type="number" placeholder="حد تنبيه المخزون (5)" value={form.stock_alert_threshold ?? ''} onChange={e => setForm(f => ({ ...f, stock_alert_threshold: parseInt(e.target.value) }))} />
            </div>
            <div className="flex gap-2">
              <Input placeholder="الباركود / رمز SKU" value={form.sku || ''} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="مسح الباركود بالكاميرا">
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* حقول خاصة بالشيشة */}
            {form.store_key === 'shisha' && (
              <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary flex items-center gap-1"><Cigarette className="w-3 h-3" /> خصائص الشيشة</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="نوع المنتج (معسل، شيشة، فحم، قصدير، إكسسوار)" value={form.accessory_type || ''} onChange={e => setForm(f => ({ ...f, accessory_type: e.target.value }))} />
                  <Input placeholder="النكهة / النوع" value={form.flavor || ''} onChange={e => setForm(f => ({ ...f, flavor: e.target.value }))} />
                  <Input placeholder="الوزن / الحجم" value={form.volume || ''} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                  <Input placeholder="ملاحظات التوافق أو الاستخدام" value={form.compatibility || ''} onChange={e => setForm(f => ({ ...f, compatibility: e.target.value }))} />
                </div>
              </div>
            )}

            {/* حقول خاصة بالبوتيك */}
            {form.store_key === 'boutique' && (
              <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary flex items-center gap-1"><Gift className="w-3 h-3" /> خصائص البوتيك</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="نوع المنتج (هدية، تحفة، زهور، إكسسوار)" value={form.accessory_type || ''} onChange={e => setForm(f => ({ ...f, accessory_type: e.target.value }))} />
                  <Input placeholder="المناسبة (عرس، عيد، ميلاد...)" value={form.compatibility || ''} onChange={e => setForm(f => ({ ...f, compatibility: e.target.value }))} />
                  <Input placeholder="اللون" value={form.color_name || ''} onChange={e => setForm(f => ({ ...f, color_name: e.target.value }))} />
                  <Input placeholder="المقاس / الحجم" value={form.volume || ''} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                </div>
              </div>
            )}

            {/* حقول خاصة بالعطور */}
            {form.store_key === 'perfume' && (
              <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary flex items-center gap-1"><Droplet className="w-3 h-3" /> خصائص العطور</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="الفئة (رجالي، نسائي، للجنسين)" value={form.accessory_type || ''} onChange={e => setForm(f => ({ ...f, accessory_type: e.target.value }))} />
                  <Input placeholder="العائلة العطرية / الرائحة" value={form.flavor || ''} onChange={e => setForm(f => ({ ...f, flavor: e.target.value }))} />
                  <Input placeholder="الحجم (مل)" value={form.volume || ''} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                  <Input placeholder="التركيز (EDP / EDT / Parfum)" value={form.nicotine_level || ''} onChange={e => setForm(f => ({ ...f, nicotine_level: e.target.value }))} />
                </div>
              </div>
            )}

            {/* حقول خاصة بالفيب */}
            {form.store_key === 'vape' && (
              <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary flex items-center gap-1"><Zap className="w-3 h-3" /> خصائص الفيب</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="نوع المنتج / الجهاز" value={form.accessory_type || ''} onChange={e => setForm(f => ({ ...f, accessory_type: e.target.value }))} />
                  <Input placeholder="النكهة" value={form.flavor || ''} onChange={e => setForm(f => ({ ...f, flavor: e.target.value }))} />
                  <Input placeholder="مستوى النيكوتين" value={form.nicotine_level || ''} onChange={e => setForm(f => ({ ...f, nicotine_level: e.target.value }))} />
                  <Input placeholder="الحجم (مل) / عدد السحبات" value={form.volume || ''} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                </div>
              </div>
            )}

            {/* حقول خاصة بالحيوانات الأليفة */}
            {form.store_key === 'pets' && (
              <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary flex items-center gap-1"><Tag className="w-3 h-3" /> خصائص الحيوانات الأليفة</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="نوع الحيوان (قطط، كلاب، طيور)" value={form.accessory_type || ''} onChange={e => setForm(f => ({ ...f, accessory_type: e.target.value }))} />
                  <Input placeholder="الوزن (كجم)" value={form.volume || ''} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                  <Input placeholder="النكهة / المكون" value={form.flavor || ''} onChange={e => setForm(f => ({ ...f, flavor: e.target.value }))} />
                  <Input placeholder="العمر المناسب" value={form.compatibility || ''} onChange={e => setForm(f => ({ ...f, compatibility: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Image */}
            <AIImageField
              value={form.image}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
              context={{ type: 'product', title: form.title, subtitle: form.subtitle, storeKey: form.store_key, store_key: form.store_key, product_id: editing?.id }}
              label="صورة المنتج"
              aspect="h-40"
            />

            {/* معرض الصور الإضافية */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">صور إضافية للمعرض</p>
              {form.images && form.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg w-5 h-5 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">أضف صور المعرض كرابط مباشر، دون استخدام خدمات رفع أو رصيد تكاملات.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="أو الصق رابط صورة للمعرض"
                  value={imgUrlInput}
                  onChange={e => setImgUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const u = imgUrlInput.trim();
                    if (!u) return;
                    setForm(f => ({ ...f, images: [...(f.images || []), u] }));
                    setImgUrlInput('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><Switch checked={form.is_featured || false} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} /><span className="text-sm">مميز</span></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_bestseller || false} onCheckedChange={v => setForm(f => ({ ...f, is_bestseller: v }))} /><span className="text-sm">الأكثر مبيعاً</span></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_new || false} onCheckedChange={v => setForm(f => ({ ...f, is_new: v }))} /><span className="text-sm">جديد</span></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_coming_soon || false} onCheckedChange={v => setForm(f => ({ ...f, is_coming_soon: v }))} /><span className="text-sm">قادم قريباً</span></div>
            </div>

            {/* الاشتراك الدوري */}
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_subscribable || false} onCheckedChange={v => setForm(f => ({ ...f, is_subscribable: v }))} />
                <span className="text-sm font-bold">🔁 متاح للاشتراك الدوري</span>
              </div>
              {form.is_subscribable && (
                <Input type="number" placeholder="نسبة خصم المشترك % (افتراضي 10)" value={form.subscription_discount || ''} onChange={e => setForm(f => ({ ...f, subscription_discount: parseInt(e.target.value) }))} />
              )}
            </div>

            <Select value={form.status || 'active'} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">مفعل</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSave} className="w-full">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} />
    </div>
  );
}