import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, Link2, Palette, Store as StoreIcon, Phone, Share2, FileText, Bot, Plus, X, Navigation, Tags } from 'lucide-react';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { uploadToR2 } from '@/lib/uploadToR2';
import { logAction } from '@/lib/auditLog';

const NAV_KEYS = [
  { key: 'shop', label: 'المتجر' },
  { key: 'blog', label: 'المجلة' },
  { key: 'loyalty', label: 'نقاط الولاء' },
  { key: 'contests', label: 'المسابقات' },
  { key: 'gallery', label: 'المعرض' },
  { key: 'videos', label: 'الفيديو' },
  { key: 'gift_cards', label: 'بطاقات الهدايا' },
  { key: 'contact', label: 'تواصل معنا' },
  { key: 'guide', label: 'دليل الاستخدام' },
];

const STORE_KEYS = [
  { key: 'emad_phones', label: 'القسم الأول', defaultName: 'الهواتف الذكية', defaultIcon: 'smartphone' },
  { key: 'emad_laptops', label: 'القسم الثاني', defaultName: 'لابتوبات وتابلت', defaultIcon: 'monitor' },
  { key: 'emad_accessories', label: 'القسم الثالث', defaultName: 'إكسسوارات', defaultIcon: 'headphones' },
  { key: 'emad_home', label: 'القسم الرابع', defaultName: 'أجهزة منزلية', defaultIcon: 'zap' },
  { key: 'emad_offers', label: 'القسم الخامس', defaultName: 'عروض مميزة', defaultIcon: 'tag' },
];

export default function AdminSettings() {
  const { settings: ctxSettings, settingsId: ctxId, reloadSettings } = useStoreSettings();
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    if (ctxSettings) {
      const tc = ctxSettings.theme_config || {};
      setSettings({
        ...ctxSettings,
        exchange_rates: { USD: 1, SAR: 3.75, YER_OLD: 530, YER_NEW: 1630, AED: 3.67, ...(ctxSettings.exchange_rates || {}) },
        theme_config: {
          nav_labels: { ...NAV_KEYS.reduce((acc, n) => ({ ...acc, [n.key]: '' }), {}) },
          store_names: {},
          store_icons: {},
          quick_suggestions: [],
          ...tc,
        },
      });
      setSettingsId(ctxId);
      setLoading(false);
    }
  }, [ctxSettings, ctxId]);

  const handleSave = async () => {
    if (!settings.store_name) return toast.error('أدخل اسم المتجر');
    if (settingsId) {
      await base44.entities.StoreSettings.update(settingsId, settings);
    } else {
      const created = await base44.entities.StoreSettings.create(settings);
      setSettingsId(created.id);
    }
    logAction({
      action: 'settings_change',
      entityType: 'StoreSettings',
      entityId: settingsId,
      entityName: settings.store_name,
      description: `تحديث إعدادات المتجر "${settings.store_name}"`,
    });
    await reloadSettings();
    toast.success('تم حفظ الإعدادات وتطبيقها على كامل المتجر');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً (الحد 5 ميجابايت). اختر صورة أصغر.');
      e.target.value = '';
      return;
    }
    setUploadingLogo(true);
    try {
      toast.info('جاري رفع الشعار...');
      const { file_url } = await uploadToR2(file);
      if (!file_url) throw new Error('لم يُرجع الخادم رابطاً للصورة');
      setSettings(s => ({ ...s, logo_url: file_url }));
      toast.success('تم رفع الشعار! لا تنسَ الحفظ.');
    } catch (err) {
      console.error('Logo upload error:', err);
      const msg = err?.message || String(err) || 'خطأ غير معروف';
      const hint = /credit|quota|limit|402|403/i.test(msg) ? ' — يبدو أن أرصدة التكاملات نفدت أو غير كافية' : '';
      toast.error('فشل رفع الشعار: ' + msg + hint, { duration: 8000 });
    }
    e.target.value = '';
    setUploadingLogo(false);
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الأيقونة كبير جداً (الحد 2 ميجابايت).');
      e.target.value = '';
      return;
    }
    setUploadingFavicon(true);
    try {
      toast.info('جاري رفع الأيقونة...');
      const { file_url } = await uploadToR2(file);
      if (!file_url) throw new Error('لم يُرجع الخادم رابطاً');
      setSettings(s => ({ ...s, favicon_url: file_url }));
      toast.success('تم رفع الأيقونة! لا تنسَ الحفظ.');
    } catch (err) {
      console.error('Favicon upload error:', err);
      const msg = err?.message || String(err) || 'خطأ غير معروف';
      const hint = /credit|quota|limit|402|403/i.test(msg) ? ' — يبدو أن أرصدة التكاملات نفدت أو غير كافية' : '';
      toast.error('فشل رفع الأيقونة: ' + msg + hint, { duration: 8000 });
    }
    e.target.value = '';
    setUploadingFavicon(false);
  };

  const u = (key, val) => setSettings(s => ({ ...s, [key]: val }));
  const uRate = (key, val) => setSettings(s => ({ ...s, exchange_rates: { ...s.exchange_rates, [key]: parseFloat(val) || 0 } }));
  const uTheme = (key, val) => setSettings(s => ({ ...s, theme_config: { ...(s.theme_config || {}), [key]: val } }));
  const uNavLabel = (key, val) => setSettings(s => ({ ...s, theme_config: { ...s.theme_config, nav_labels: { ...(s.theme_config?.nav_labels || {}), [key]: val } } }));
  const uStoreName = (key, val) => setSettings(s => ({ ...s, theme_config: { ...s.theme_config, store_names: { ...(s.theme_config?.store_names || {}), [key]: val } } }));
  const uStoreIcon = (key, val) => setSettings(s => ({ ...s, theme_config: { ...s.theme_config, store_icons: { ...(s.theme_config?.store_icons || {}), [key]: val } } }));
  const uSuggestion = (idx, val) => setSettings(s => { const arr = [...(s.theme_config?.quick_suggestions || [])]; arr[idx] = val; return { ...s, theme_config: { ...s.theme_config, quick_suggestions: arr } }; });
  const addSuggestion = () => setSettings(s => ({ ...s, theme_config: { ...s.theme_config, quick_suggestions: [...(s.theme_config?.quick_suggestions || []), ''] } }));
  const removeSuggestion = (idx) => setSettings(s => ({ ...s, theme_config: { ...s.theme_config, quick_suggestions: (s.theme_config?.quick_suggestions || []).filter((_, i) => i !== idx) } }));

  if (loading || !settings) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const tc = settings.theme_config || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">أداة تخصيص المتجر</h1>
          <p className="text-sm text-muted-foreground mt-1">كل تغيير هنا ينعكس فوراً على كامل التطبيق</p>
        </div>
        <Button onClick={handleSave} size="lg"><Save className="w-4 h-4 ml-2" /> حفظ وتطبيق</Button>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* هوية المتجر */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <StoreIcon className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">هوية المتجر</h3>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">اسم المتجر *</label>
            <Input placeholder="اسم المتجر" value={settings.store_name || ''} onChange={e => u('store_name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">وصف المتجر — ماذا تبيع؟ ما تخصصك؟</label>
            <Input placeholder="مثال: متجر شيشة وبوتيك وعطور وفيب ومستلزمات حيوانات أليفة" value={settings.store_type || ''} onChange={e => u('store_type', e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">اكتب وصفاً حراً لنوع متجرك ومنتجاتك</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">الشعار النصي (Slogan)</label>
            <Input placeholder="الشعار النصي" value={settings.slogan || ''} onChange={e => u('slogan', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">رقم الواتساب</label>
            <Input placeholder="9677..." value={settings.whatsapp_number || ''} onChange={e => u('whatsapp_number', e.target.value)} />
          </div>

          {/* Logo */}
          <div>
            <label className="text-sm text-muted-foreground block mb-1">شعار المتجر (يظهر في كل مكان)</label>
            {settings.logo_url && <img src={settings.logo_url} alt="logo" className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-primary/30" />}
            <div className="flex gap-2">
              <label className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <ImageIcon className="w-4 h-4 ml-2" /> {uploadingLogo ? 'جاري الرفع...' : 'رفع شعار'}
              </label>
              <Input placeholder="أو رابط الشعار" value={settings.logo_url || ''} onChange={e => u('logo_url', e.target.value)} className="flex-1" />
            </div>
          </div>

          {/* Favicon */}
          <div>
            <label className="text-sm text-muted-foreground block mb-1">أيقونة المتصفح (Favicon)</label>
            <div className="flex gap-2 items-center">
              {settings.favicon_url && <img src={settings.favicon_url} alt="favicon" className="w-8 h-8 rounded object-cover" />}
              <label className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
                <ImageIcon className="w-4 h-4 ml-2" /> {uploadingFavicon ? 'جاري الرفع...' : 'رفع أيقونة'}
              </label>
              <Input placeholder="أو رابط" value={settings.favicon_url || ''} onChange={e => u('favicon_url', e.target.value)} className="flex-1" />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">📐 مقاس الشعار المثالي: 400×400 بكسل (مربع) — أقل من 1 ميجابايت</p>
        </section>

        {/* ألوان الهوية */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">ألوان الهوية</h3>
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={settings.primary_color || '#DB2777'} onChange={e => { u('primary_color', e.target.value); uTheme('primary_color', e.target.value); }} className="w-12 h-10 rounded cursor-pointer border border-border" />
            <div>
              <span className="text-sm font-medium block">اللون الأساسي</span>
              <span className="text-xs text-muted-foreground">يُطبق على الأزرار والروابط والهيدر</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={settings.price_color || '#DB2777'} onChange={e => { u('price_color', e.target.value); uTheme('price_color', e.target.value); }} className="w-12 h-10 rounded cursor-pointer border border-border" />
            <div>
              <span className="text-sm font-medium block">لون السعر</span>
              <span className="text-xs text-muted-foreground">لون عرض أسعار المنتجات</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="color" value={tc.accent_color || '#C0C0C0'} onChange={e => uTheme('accent_color', e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-border" />
            <div>
              <span className="text-sm font-medium block">اللون الثانوي (Accent)</span>
              <span className="text-xs text-muted-foreground">لون مميز للعناصر الثانوية والرسوم البيانية</span>
            </div>
          </div>
        </section>

        {/* تسميات الأقسام */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">تسميات الأقسام</h3>
          </div>
          <p className="text-xs text-muted-foreground">غيّر أسماء الأقسام كما تريد أن تظهر في القائمة والتنقل</p>
          <div className="grid grid-cols-2 gap-3">
            {NAV_KEYS.map(n => (
              <div key={n.key}>
                <label className="text-[10px] text-muted-foreground block mb-0.5">{n.label}</label>
                <Input placeholder={n.label} value={(tc.nav_labels || {})[n.key] || ''} onChange={e => uNavLabel(n.key, e.target.value)} className="h-8 text-sm" />
              </div>
            ))}
          </div>
        </section>

        {/* أسماء وأيقونات المتاجر */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Tags className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">أسماء وأيقونات النشاطات</h3>
          </div>
          <p className="text-xs text-muted-foreground">خصّص اسم كل نشاط وأيقونته (اسم الأيقونة من مكتبة Lucide)</p>
          {STORE_KEYS.map(s => (
            <div key={s.key} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-0.5">{s.label} — الاسم</label>
                <Input placeholder={s.defaultName} value={(tc.store_names || {})[s.key] || ''} onChange={e => uStoreName(s.key, e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="w-32">
                <label className="text-[10px] text-muted-foreground block mb-0.5">الأيقونة</label>
                <Input placeholder={s.defaultIcon} value={(tc.store_icons || {})[s.key] || ''} onChange={e => uStoreIcon(s.key, e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          ))}
        </section>

        {/* مساعد المتجر الذكي */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">مساعد المتجر الذكي</h3>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">شخصية المساعد وتعليماته</label>
            <Textarea placeholder="اكتب تعليمات المساعد الذكي: صف متجرك، ماذا يبيع، كيف يجب أن يتحدث مع العملاء..." value={settings.chat_persona || ''} onChange={e => u('chat_persona', e.target.value)} rows={4} className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">اقتراحات الشات السريعة</label>
            <p className="text-[10px] text-muted-foreground mb-2">أسئلة جاهزة تظهر للعملاء عند فتح الشات</p>
            {(tc.quick_suggestions || []).map((sug, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input placeholder={`اقتراح ${i + 1}`} value={sug} onChange={e => uSuggestion(i, e.target.value)} className="h-8 text-sm flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeSuggestion(i)}><X className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSuggestion} className="w-full"><Plus className="w-3 h-3 ml-1" /> إضافة اقتراح</Button>
          </div>
        </section>

        {/* بطاقة المنتج */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <h3 className="font-heading font-bold">بطاقة المنتج</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><Switch checked={settings.card_show_price !== false} onCheckedChange={v => u('card_show_price', v)} /><span className="text-sm">السعر</span></div>
            <div className="flex items-center gap-2"><Switch checked={settings.card_show_cart !== false} onCheckedChange={v => u('card_show_cart', v)} /><span className="text-sm">زر السلة</span></div>
            <div className="flex items-center gap-2"><Switch checked={settings.card_show_fav !== false} onCheckedChange={v => u('card_show_fav', v)} /><span className="text-sm">المفضلة</span></div>
            <div className="flex items-center gap-2"><Switch checked={settings.card_show_compare !== false} onCheckedChange={v => u('card_show_compare', v)} /><span className="text-sm">المقارنة</span></div>
          </div>
        </section>

        {/* العملات */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <h3 className="font-heading font-bold">العملات وأسعار الصرف</h3>
          <p className="text-xs text-muted-foreground">جميع أسعار المنتجات تُدخل بالدولار، وتُحوّل تلقائياً</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground block mb-1">دولار أمريكي</label><Input type="number" step="0.01" value={settings.exchange_rates?.USD ?? 1} onChange={e => uRate('USD', e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">ريال سعودي</label><Input type="number" step="0.01" value={settings.exchange_rates?.SAR || 0} onChange={e => uRate('SAR', e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">ريال يمني (قديم)</label><Input type="number" value={settings.exchange_rates?.YER_OLD || 0} onChange={e => uRate('YER_OLD', e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">ريال يمني (جديد)</label><Input type="number" value={settings.exchange_rates?.YER_NEW || 0} onChange={e => uRate('YER_NEW', e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">درهم إماراتي</label><Input type="number" step="0.01" value={settings.exchange_rates?.AED || 0} onChange={e => uRate('AED', e.target.value)} /></div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">العملة المعروضة للعملاء</label>
            <select value={settings.currency || 'USD'} onChange={e => u('currency', e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="USD">دولار أمريكي</option>
              <option value="SAR">ريال سعودي</option>
              <option value="YER_OLD">ريال يمني (قديم)</option>
              <option value="YER_NEW">ريال يمني (جديد)</option>
              <option value="AED">درهم إماراتي</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">تعديل الأسعار (%) — يطبق على كامل المتجر</label>
            <Input type="number" placeholder="0" value={settings.global_price_modifier || 0} onChange={e => u('global_price_modifier', parseFloat(e.target.value))} />
          </div>
        </section>

        {/* المحتوى والفوتر */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">المحتوى والفوتر</h3>
          </div>
          <Textarea placeholder="نبذة عن المتجر" value={settings.footer_about || ''} onChange={e => u('footer_about', e.target.value)} rows={3} />
          <Input placeholder="نص حقوق الملكية (مثل: جميع الحقوق محفوظة)" value={settings.copyright_text || ''} onChange={e => u('copyright_text', e.target.value)} />
        </section>

        {/* التواصل */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">معلومات التواصل</h3>
          </div>
          <Input placeholder="رقم الهاتف" value={settings.footer_phone || ''} onChange={e => u('footer_phone', e.target.value)} />
          <Input placeholder="البريد الإلكتروني" value={settings.footer_email || ''} onChange={e => u('footer_email', e.target.value)} />
          <Input placeholder="العنوان" value={settings.footer_address || ''} onChange={e => u('footer_address', e.target.value)} />
        </section>

        {/* روابط التواصل الاجتماعي */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">روابط التواصل الاجتماعي</h3>
          </div>
          <Input placeholder="رابط فيسبوك" value={settings.social_facebook || ''} onChange={e => u('social_facebook', e.target.value)} />
          <Input placeholder="رابط انستقرام" value={settings.social_instagram || ''} onChange={e => u('social_instagram', e.target.value)} />
          <Input placeholder="رابط تويتر (X)" value={settings.social_twitter || ''} onChange={e => u('social_twitter', e.target.value)} />
          <Input placeholder="رابط تيك توك" value={settings.social_tiktok || ''} onChange={e => u('social_tiktok', e.target.value)} />
          <Input placeholder="رابط يوتيوب" value={settings.social_youtube || ''} onChange={e => u('social_youtube', e.target.value)} />
          <Input placeholder="رابط سناب شات" value={settings.social_snapchat || ''} onChange={e => u('social_snapchat', e.target.value)} />
          <Input placeholder="رابط تيليجرام" value={settings.social_telegram || ''} onChange={e => u('social_telegram', e.target.value)} />
          <Input placeholder="رابط واتساب (افتراضي: من رقم الواتساب)" value={settings.social_whatsapp || ''} onChange={e => u('social_whatsapp', e.target.value)} />
        </section>

        {/* روابط إضافية */}
        <section className="bg-card rounded-xl p-4 border border-border/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">روابط إضافية</h3>
          </div>
          <Input placeholder="رابط Linktree" value={settings.linktree || ''} onChange={e => u('linktree', e.target.value)} />
        </section>
      </div>
    </div>
  );
}