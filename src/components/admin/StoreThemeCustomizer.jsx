import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, Palette, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { STORE_PRESETS, buildThemeConfig, buildChatPersona, buildSlogan } from '@/lib/storePresets';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function StoreThemeCustomizer() {
  const { settings, settingsId, reloadSettings } = useStoreSettings();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [appliedPreset, setAppliedPreset] = useState(null);

  // ─── Quick Preset Buttons ──────────────────────────────────
  const applyPreset = async (presetKey) => {
    const preset = STORE_PRESETS[presetKey];
    if (!preset) return;
    setLoading(true);
    setAppliedPreset(presetKey);
    try {
      const themeConfig = buildThemeConfig(presetKey);
      const chatPersona = buildChatPersona(presetKey);
      const slogan = buildSlogan(presetKey);

      setPreview({
        presetKey,
        store_type: presetKey,
        primary_color: preset.primary_color,
        accent_color: preset.accent_color,
        slogan,
        store_names: preset.store_names,
        store_icons: preset.store_icons,
        nav_labels: preset.nav_labels,
        quick_suggestions: preset.quick_suggestions,
        chat_persona: chatPersona,
      });
      toast.success(`تم تحميل إعدادت "${preset.label}" — اضغط "تطبيق" للحفظ`);
    } catch (e) {
      toast.error('فشل تحميل الإعدادت');
    }
    setLoading(false);
  };

  // ─── Apply to StoreSettings ─────────────────────────────────
  const applyTheme = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const updateData = {
        store_type: preview.store_type,
        slogan: preview.slogan,
        primary_color: preview.primary_color,
        price_color: preview.price_color || preview.primary_color,
        theme_config: {
          primary_color: preview.primary_color,
          price_color: preview.price_color || preview.primary_color,
          accent_color: preview.accent_color,
          nav_labels: preview.nav_labels,
          store_names: preview.store_names,
          store_icons: preview.store_icons,
          quick_suggestions: preview.quick_suggestions,
        },
        chat_persona: preview.chat_persona,
      };

      if (preview.store_name) updateData.store_name = preview.store_name;
      if (preview.footer_about) updateData.footer_about = preview.footer_about;

      if (settingsId) {
        await base44.entities.StoreSettings.update(settingsId, updateData);
      } else {
        await base44.entities.StoreSettings.create({ ...updateData, store_name: preview.store_name || settings.store_name });
      }

      await reloadSettings();
      toast.success('تم تطبيق الثيم الجديد على كامل التطبيق!');
      setPreview(null);
    } catch (e) {
      toast.error('فشل حفظ الإعدادات');
    }
    setLoading(false);
  };

  const resetToDefault = async () => {
    setLoading(true);
    try {
      await applyPreset('basha');
      setTimeout(() => applyTheme(), 200);
    } catch (e) {
      toast.error('فشل إعادة التعيين');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">مخصص المتجر الذكي</h2>
            <p className="text-xs text-muted-foreground">حوّل التطبيق لأي نوع متجر بكلمة واحدة</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetToDefault} disabled={loading} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة للوضع الافتراضي
        </Button>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-sm font-medium mb-3">إعدادات جاهزة — اختر نوع المتجر:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(STORE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                appliedPreset === key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-accent/50'
              }`}
            >
              <preset.icon className="w-6 h-6" style={{ color: preset.primary_color }} />
              <span className="text-[11px] font-medium text-center leading-tight">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-primary/30 overflow-hidden"
        >
          <div
            className="p-4 text-white"
            style={{ background: `linear-gradient(135deg, ${preview.primary_color}, ${preview.accent_color})` }}
          >
            <h3 className="font-bold text-lg">{preview.store_name || 'معاينة المتجر'}</h3>
            <p className="text-sm opacity-90">{preview.slogan}</p>
          </div>
          <div className="p-4 space-y-3 bg-background">
            {/* Colors */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium w-20">الألوان:</span>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full border" style={{ background: preview.primary_color }} />
                  <span className="text-[10px]">أساسي</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full border" style={{ background: preview.accent_color }} />
                  <span className="text-[10px]">ثانوي</span>
                </div>
              </div>
            </div>
            {/* Store sections */}
            <div>
              <span className="text-xs font-medium">الأقسام الخمسة:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(preview.store_names || {}).map(([key, name]) => (
                  <span key={key} className="px-2 py-1 rounded-lg bg-accent text-[11px] font-medium">{name}</span>
                ))}
              </div>
            </div>
            {/* Chat suggestions */}
            {preview.quick_suggestions && (
              <div>
                <span className="text-xs font-medium">اقتراحات المساعد الذكي:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {preview.quick_suggestions.slice(0, 3).map((s, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-secondary text-[11px]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Chat persona */}
            {preview.chat_persona && (
              <div>
                <span className="text-xs font-medium">شخصية المساعد الذكي:</span>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{preview.chat_persona}</p>
              </div>
            )}
            {/* Apply Button */}
            <Button onClick={applyTheme} disabled={loading} className="w-full gap-2 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              تطبيق الثيم على التطبيق
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}