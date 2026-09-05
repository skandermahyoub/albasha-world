import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/lib/useStoreSettings';

import { getStores } from '@/lib/navLinks';

export default function AdminStoreConfigs() {
  const { settings } = useStoreSettings();
  const STORES = getStores(settings?.theme_config || {});
  const [configs, setConfigs] = useState({});
  const [configIds, setConfigIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [bgUrlInput, setBgUrlInput] = useState({});

  useEffect(() => {
    base44.entities.StoreConfig.list().catch(() => []).then(all => {
      const map = {};
      const ids = {};
      all.forEach(c => { map[c.store_key] = c; ids[c.store_key] = c.id; });
      STORES.forEach(s => {
        if (!map[s.key]) map[s.key] = { store_key: s.key, bg_effect_active: true, bg_images: [] };
      });
      setConfigs(map);
      setConfigIds(ids);
      setLoading(false);
    });
  }, []);

  const updateField = (storeKey, field, value) => {
    setConfigs(prev => ({ ...prev, [storeKey]: { ...prev[storeKey], [field]: value } }));
  };

  const saveConfig = async (storeKey) => {
    setSaving(prev => ({ ...prev, [storeKey]: true }));
    const config = configs[storeKey];
    if (configIds[storeKey]) {
      await base44.entities.StoreConfig.update(configIds[storeKey], config);
    } else {
      const created = await base44.entities.StoreConfig.create(config);
      setConfigIds(prev => ({ ...prev, [storeKey]: created.id }));
    }
    setSaving(prev => ({ ...prev, [storeKey]: false }));
    toast.success(`تم حفظ إعدادات متجر ${storeKey}`);
  };

  const removeBgImage = (storeKey, idx) => {
    const imgs = [...(configs[storeKey]?.bg_images || [])];
    imgs.splice(idx, 1);
    updateField(storeKey, 'bg_images', imgs);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-2">إعدادات أقسام {settings?.store_name || 'متجري'}</h1>
      <p className="text-sm text-muted-foreground mb-2">تخصيص واتساب وخلفيات كل قسم</p>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6 text-sm">
        💡 <strong>ملاحظة:</strong> أول رابط في "صور الخلفية المتغيرة" يظهر كصورة بطاقة القسم في الصفحة الرئيسية.
      </div>

      <div className="space-y-6">
        {STORES.map(store => {
          const config = configs[store.key] || {};
          return (
            <div key={store.key} className="bg-card rounded-2xl border-2 p-5" style={{ borderColor: store.color }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg">{store.name}</h2>
                <Button
                  size="sm"
                  onClick={() => saveConfig(store.key)}
                  disabled={saving[store.key]}
                >
                  {saving[store.key] ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                  حفظ
                </Button>
              </div>

              {/* WhatsApp */}
              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">رقم واتساب المتجر</label>
                <Input
                  placeholder="966xxxxxxxxx"
                  value={config.whatsapp_number || ''}
                  onChange={e => updateField(store.key, 'whatsapp_number', e.target.value)}
                />
              </div>

              {/* Background Effect */}
              <div className="flex items-center gap-2 mb-4">
                <Switch
                  checked={config.bg_effect_active !== false}
                  onCheckedChange={v => updateField(store.key, 'bg_effect_active', v)}
                />
                <span className="text-sm">تفعيل خلفية متغيرة في صفحة المتجر</span>
              </div>

              {/* BG Images */}
              <div>
                <p className="text-sm font-medium mb-2">صور الخلفية المتغيرة ({(config.bg_images || []).length})</p>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(config.bg_images || []).map((img, i) => (
                    <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeBgImage(store.key, i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="أو الصق رابط صورة"
                    value={bgUrlInput[store.key] || ''}
                    onChange={e => setBgUrlInput(prev => ({ ...prev, [store.key]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const u = (bgUrlInput[store.key] || '').trim();
                      if (!u) return;
                      updateField(store.key, 'bg_images', [...(config.bg_images || []), u]);
                      setBgUrlInput(prev => ({ ...prev, [store.key]: '' }));
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">📐 مقاس مثالي: 1200×800، أقل من 1 ميجابايت</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}