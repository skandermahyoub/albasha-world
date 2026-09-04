import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon, Search, Smartphone, Monitor, Headphones, Zap, Tag, Cigarette, Gift, Droplet, Wine, PawPrint, Camera, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';
import { logAction } from '@/lib/auditLog';
import AIImageField from '@/components/admin/AIImageField';

import { getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function AdminProducts() {
  const { settings } = useStoreSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [imgUrlInput, setImgUrlInput] = useState('');

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

  const handleMultiImageUpload = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/') && f.size < 5 * 1024 * 1024);
    if (!files.length) return toast.error('صور غير صالحة (يجب أن تكون صورة أقل من 5 ميجابايت)');
    toast.info(`جاري رفع ${files.length} صور...`);
    const urls = [];
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      } catch (err) {}
    }
    setForm(f => ({ ...f, images: [...(f.images || []), ...urls] }));
    toast.success(`تم رفع ${urls.length} صورة`);
  };

  const STORES = getStores(settings?.theme_config || {}).map(s => ({ ...s, label: s.name }));

  const LOW_STOCK_THRESHOLD = 5;

  const loadData = async () => {
    const [p, c] = await Promise.all([
      base44.entities.Product.list('-created_date', 500).catch(() => []),
      base44.entities.Category.list('sort_order').catch(() => []),
    ]);
    setProducts(p);
    setCategories(c);

    // تنبيه المخزون المنخفض
    const lowStock = p.filter(prod => prod.stock !== undefined && prod.stock !== null && prod.stock <= LOW_STOCK_THRESHOLD && prod.status === 'active');
    if (lowStock.length > 0) {
      toast.warning(`⚠️ ${lowStock.length} منتج بمخزون منخفض (${LOW_STOCK_THRESHOLD} أو أقل)`, {
        duration: 6000,
        description: lowStock.slice(0, 3).map(p => `• ${p.title}: ${p.stock} متبقي`).join('\n'),
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل اسم المنتج');
    if (!form.price || form.price <= 0) return toast.error('أدخل سعراً صحيحاً (أكبر من صفر)');
    if (!form.store_key) return toast.error('اختر المتجر أولاً');
    if (!form.category_id) return toast.error('اختر التصنيف أولاً');
    if (editing) {
      const oldPrice = editing.price;
      await base44.entities.Product.update(editing.id, form);
      // تسجيل في سجل النشاط
      logAction({
        action: oldPrice !== form.price ? 'price_change' : 'update',
        entityType: 'Product',
        entityId: editing.id,
        entityName: form.title,
        description: oldPrice !== form.price
          ? `تغيير سعر المنتج "${form.title}" من ${oldPrice} إلى ${form.price}`
          : `تعديل المنتج "${form.title}"`,
        oldValue: editing,
        newValue: form,
      });
      toast.success('تم تحديث المنتج');
    } else {
      const created = await base44.entities.Product.create({ ...form, status: form.status || 'active' });
      logAction({
        action: 'create',
        entityType: 'Product',
        entityId: created?.id,
        entityName: form.title,
        description: `إضافة منتج جديد: "${form.title}" بسعر ${form.price}`,
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

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchStore = filterStore === 'all' || p.store_key === filterStore;
    return matchSearch && matchStore;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-2xl">المنتجات ({products.length})</h1>
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
              <Input type="number" placeholder="السعر بالدولار *" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} />
              <Input type="number" placeholder="السعر القديم بالدولار" value={form.old_price || ''} onChange={e => setForm(f => ({ ...f, old_price: parseFloat(e.target.value) }))} />
            </div>
            {form.old_price && form.old_price > 0 && (
              <Input type="date" placeholder="تاريخ انتهاء الخصم" value={form.discount_end_date || ''} onChange={e => setForm(f => ({ ...f, discount_end_date: e.target.value }))} />
            )}
            <Input placeholder="العلامة التجارية" value={form.brand || ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
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
              <label className="block w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                <input type="file" accept="image/*" multiple onChange={handleMultiImageUpload} className="hidden" />
                <ImageIcon className="w-4 h-4 ml-2" /> رفع صور للمعرض
              </label>
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