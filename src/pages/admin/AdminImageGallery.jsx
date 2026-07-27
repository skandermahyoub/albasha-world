import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Copy, Search, Sparkles, Loader2, Calendar, Store as StoreIcon, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { Link } from 'react-router-dom';
import ShareButton from '@/components/admin/ShareButton';

const SOURCE_LABELS = {
  product: 'منتج', slide: 'شريحة', banner: 'إعلان', offer: 'عرض',
  bundle: 'باقة', category: 'تصنيف', logo: 'شعار', gallery: 'معرض',
};

const STORE_LABELS = {
  shisha: 'شيشة 🚬',
  boutique: 'بوتيك 🎁',
  perfume: 'عطور 💧',
  vape: 'فيب 💊',
  pets: 'بيتس 🐾',
};

const STORE_COLORS = {
  shisha: '#C2185B',
  boutique: '#D81B60',
  perfume: '#AD1457',
  vape: '#E91E63',
  pets: '#F06292',
};

export default function AdminImageGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStore, setFilterStore] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [groupByDate, setGroupByDate] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.GeneratedImage.list('-created_date', 500)
      .then(setImages)
      .catch(() => [])
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('حذف هذه الصورة من المعرض؟')) return;
    await base44.entities.GeneratedImage.delete(id);
    toast.success('تم الحذف');
    load();
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const sourceTypes = [...new Set(images.map(img => img.source_type).filter(Boolean))];
  const storeKeys = [...new Set(images.map(img => img.store_key).filter(Boolean))];

  let filtered = images.filter(img => {
    const matchSearch = !search || (img.prompt || '').toLowerCase().includes(search.toLowerCase()) || (img.source_title || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || img.source_type === filterType;
    const matchStore = filterStore === 'all' || img.store_key === filterStore;
    return matchSearch && matchType && matchStore;
  });

  filtered = [...filtered].sort((a, b) => {
    const da = new Date(a.created_date || 0), db = new Date(b.created_date || 0);
    return sortOrder === 'newest' ? db - da : da - db;
  });

  const formatDate = (d) => d ? moment(d).format('YYYY/MM/DD HH:mm') : '';

  const getDateGroup = (d) => {
    if (!d) return 'أقدم';
    const now = moment();
    const m = moment(d);
    if (m.isSame(now, 'day')) return 'اليوم';
    if (m.isSame(now.clone().subtract(1, 'day'), 'day')) return 'أمس';
    if (m.isAfter(now.clone().subtract(7, 'days'))) return 'هذا الأسبوع';
    if (m.isSame(now, 'month')) return 'هذا الشهر';
    if (m.isSame(now.clone().subtract(1, 'month'), 'month')) return 'الشهر الماضي';
    return 'أقدم';
  };

  const DATE_GROUP_ORDER = ['اليوم', 'أمس', 'هذا الأسبوع', 'هذا الشهر', 'الشهر الماضي', 'أقدم'];

  const grouped = {};
  filtered.forEach(img => {
    const g = getDateGroup(img.created_date);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(img);
  });
  const sortedGroups = DATE_GROUP_ORDER.filter(g => grouped[g]?.length).map(g => ({ label: g, items: grouped[g] }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            معرض صور الذكاء الاصطناعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{images.length} صورة مولّدة — مصنّفة حسب المتجر والتاريخ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث بالوصف أو العنوان..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')} className="gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'newest' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
          </Button>
          <Button variant={groupByDate ? 'default' : 'outline'} size="sm" onClick={() => setGroupByDate(!groupByDate)} className="gap-1">
            <Calendar className="w-3.5 h-3.5" />
            تجميع حسب التاريخ
          </Button>
        </div>

        {/* Store filters */}
        {storeKeys.length > 0 && (
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-1"><StoreIcon className="w-3 h-3" /> المتجر:</span>
            <button onClick={() => setFilterStore('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterStore === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              الكل
            </button>
            {storeKeys.map(key => (
              <button key={key} onClick={() => setFilterStore(key)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterStore === key ? 'text-white' : 'bg-secondary text-secondary-foreground'}`} style={filterStore === key ? { backgroundColor: STORE_COLORS[key] } : {}}>
                {STORE_LABELS[key] || key}
              </button>
            ))}
          </div>
        )}

        {/* Source type filters */}
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[10px] text-muted-foreground ml-1">النوع:</span>
          <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            الكل ({images.length})
          </button>
          {sourceTypes.map(type => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {SOURCE_LABELS[type] || type} ({images.filter(i => i.source_type === type).length})
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد صور مولّدة بعد</p>
          <p className="text-xs mt-1">سيظهر هنا كل ما تولّده بالذكاء الاصطناعي من مختلف الأقسام</p>
        </div>
      ) : (
        <div className="space-y-5">
          {(groupByDate ? sortedGroups : [{ label: null, items: filtered }]).map(group => (
            <div key={group.label || 'all'}>
              {group.label && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground">{group.label}</h3>
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{group.items.length} صورة</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.items.map(img => (
                  <div key={img.id} className="bg-card rounded-xl border border-border/50 overflow-hidden group">
                    <div className="relative aspect-square bg-secondary cursor-pointer" onClick={() => setPreviewImg(img)}>
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button size="icon" variant="secondary" className="w-8 h-8" onClick={(e) => { e.stopPropagation(); copyUrl(img.image_url); }}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="destructive" className="w-8 h-8" onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex gap-1 flex-wrap">
                        {img.source_type && (
                          <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                            {SOURCE_LABELS[img.source_type] || img.source_type}
                          </span>
                        )}
                        {img.store_key && (
                          <span className="text-[9px] text-white px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: STORE_COLORS[img.store_key] || '#888' }}>
                            {STORE_LABELS[img.store_key]?.split(' ')[0] || img.store_key}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      {img.prompt && <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mb-1">{img.prompt}</p>}
                      {img.source_title && <p className="text-[10px] font-medium text-foreground/70 truncate">{img.source_title}</p>}
                      {img.product_id && <Link to={`/product/${img.product_id}`} className="text-[9px] text-primary hover:underline block mt-0.5">عرض المنتج ←</Link>}
                      {img.created_date && (
                        <p className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {formatDate(img.created_date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full preview modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImg(null)}>
          <div className="max-w-3xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <img src={previewImg?.image_url} alt="" className="max-w-full max-h-[90vh] rounded-lg" />
            <div className="absolute top-2 left-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => copyUrl(previewImg?.image_url)}>
                <Copy className="w-3.5 h-3.5 ml-1" /> نسخ
              </Button>
              <ShareButton imageUrl={previewImg?.image_url} title={previewImg?.source_title || 'صورة'} description={previewImg?.prompt} storeKey={previewImg?.store_key} />
              <Button size="sm" variant="destructive" onClick={() => setPreviewImg(null)}>إغلاق</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}