import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Upload, Palette, Type, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/lib/useStoreSettings';
import StorePreview from '@/components/admin/StorePreview';
import { STORE_SECTIONS } from '@/lib/storeSections';
import { Eye } from 'lucide-react';

const STORES = STORE_SECTIONS.map(s => ({
  key: s.key,
  name: s.nameAr,
  icon: s.emoji,
  defaultColor: s.color,
}));

const FONTS = [
  { value: 'Readex Pro', label: 'Readex Pro' },
  { value: 'Cairo', label: 'Cairo — كايرو' },
  { value: 'Tajawal', label: 'Tajawal — تجوال' },
  { value: 'Noto Kufi Arabic', label: 'Noto Kufi Arabic — نوتو كوفي' },
];

export default function AdminStoreIdentity() {
  const { settings, settingsId, reloadSettings } = useStoreSettings();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingStore, setUploadingStore] = useState(null);
  const [previewStore, setPreviewStore] = useState('shisha');

  useEffect(() => {
    if (settings) {
      const tc = settings.theme_config || {};
      setTheme({
        heading_font: tc.heading_font || 'Cairo',
        body_font: tc.body_font || 'Tajawal',
        store_themes: STORES.reduce((acc, s) => ({
          ...acc,
          [s.key]: { logo_url: '', primary_color: '', font: '', ...((tc.store_themes || {})[s.key] || {}) },
        }), {}),
      });
      setLoading(false);
    }
  }, [settings]);

  const handleSave = async () => {
    const updated = {
      ...settings,
      theme_config: {
        ...(settings.theme_config || {}),
        heading_font: theme.heading_font,
        body_font: theme.body_font,
        store_themes: theme.store_themes,
      },
    };
    if (settingsId) {
      await base44.entities.StoreSettings.update(settingsId, updated);
    } else {
      await base44.entities.StoreSettings.create(updated);
    }
    await reloadSettings();
    toast.success('تم حفظ الهوية البصرية وتطبيقها على كامل التطبيق');
  };

  const handleLogoUpload = async (storeKey, file) => {
    if (!file) return;
    setUploadingStore(storeKey);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('no file url');
      setTheme(t => ({
        ...t,
        store_themes: { ...t.store_themes, [storeKey]: { ...t.store_themes[storeKey], logo_url: file_url } },
      }));
      toast.success('تم رفع شعار القسم؛ لا تنسَ الحفظ');
    } catch {
      toast.error('فشل رفع شعار القسم');
    } finally {
      setUploadingStore(null);
    }
  };

  const u = (key, val) => setTheme(t => ({ ...t, [key]: val }));
  const uStore = (storeKey, field, val) => setTheme(t => ({
    ...t,
    store_themes: { ...t.store_themes, [storeKey]: { ...t.store_themes[storeKey], [field]: val } },
  }));

  if (loading || !theme) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            الهوية البصرية للنشاطات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">تحكم مركزي في الشعارات والألوان والخطوط — يُطبّق فوراً على كامل التطبيق</p>
        </div>
        <Button onClick={handleSave} size="lg"><Save className="w-4 h-4 ml-2" /> حفظ وتطبيق</Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6">
        {/* Global Fonts */}
        <section className="bg-card rounded-xl p-5 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Type className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">خطوط الكتابة العامة</h3>
          </div>
          <p className="text-xs text-muted-foreground">تُطبّق على كامل واجهة التطبيق فور الحفظ</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">خط العناوين</label>
              <select value={theme.heading_font} onChange={e => u('heading_font', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">خط النصوص</label>
              <select value={theme.body_font} onChange={e => u('body_font', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
            <p className="text-lg font-bold" style={{ fontFamily: `'${theme.heading_font}', sans-serif` }}>معاينة العنوان — عالم الباشا</p>
            <p className="text-sm" style={{ fontFamily: `'${theme.body_font}', sans-serif` }}>معاينة النص العادي — هذا مثال على كيف سيبدو النص في المتجر</p>
          </div>
        </section>

        {/* Per-store identity */}
        <section className="space-y-3">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-primary" />
            هوية كل نشاط
          </h3>
          {STORES.map(store => {
            const st = theme.store_themes[store.key] || {};
            return (
              <div key={store.key} className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{store.icon}</span>
                  <span className="font-heading font-bold">{store.name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">شعار القسم/النشاط (اختياري ومستقل عن الشعار الرئيسي)</label>
                    {st.logo_url && <img src={st.logo_url} alt="" className="w-16 h-16 rounded-lg object-cover mb-2 border border-border" />}
                    <div className="space-y-2">
                      <label className="inline-flex w-full items-center justify-center gap-2 h-9 px-3 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-accent cursor-pointer">
                        <input type="file" accept="image/*" onChange={e => handleLogoUpload(store.key, e.target.files?.[0])} className="hidden" />
                        <Upload className="w-4 h-4" /> {uploadingStore === store.key ? 'جاري الرفع...' : 'رفع شعار القسم'}
                      </label>
                      <Input
                        value={st.logo_url || ''}
                        onChange={e => uStore(store.key, 'logo_url', e.target.value)}
                        placeholder="أو رابط شعار القسم"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">لون الهوية</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={st.primary_color || store.defaultColor} onChange={e => uStore(store.key, 'primary_color', e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-border" />
                      <Input value={st.primary_color || ''} onChange={e => uStore(store.key, 'primary_color', e.target.value)} placeholder={store.defaultColor} className="flex-1 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">خط مخصص (اختياري)</label>
                    <select value={st.font || ''} onChange={e => uStore(store.key, 'font', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                      <option value="">استخدام الخط العام</option>
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">معاينة مباشرة</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {STORES.map(s => (
              <button key={s.key} onClick={() => setPreviewStore(s.key)} className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${previewStore === s.key ? 'text-white' : 'bg-secondary text-secondary-foreground'}`} style={previewStore === s.key ? { backgroundColor: theme.store_themes[s.key]?.primary_color || s.defaultColor } : {}}>
                {s.icon} {s.name}
              </button>
            ))}
          </div>
          <StorePreview theme={theme} storeKey={previewStore} />
          <p className="text-[10px] text-muted-foreground text-center">التغييرات تظهر هنا فوراً قبل الحفظ</p>
        </div>
      </div>
    </div>
  );
}