import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { buildStoreNames, buildStoreIcons, buildStoreColors, buildStoreThemes } from '@/lib/storeSections';

const StoreSettingsContext = createContext(null);

const BASHA_NAV_LABELS = {
  shop: 'جميع المنتجات', blog: 'مجلة الباشا', loyalty: 'نقاط الولاء',
  contests: 'المسابقات', gallery: 'المعرض', videos: 'الفيديو',
  gift_cards: 'بطاقات الهدايا', contact: 'تواصل معنا', guide: 'دليل الاستخدام'
};

const BASHA_SUGGESTIONS = [
  'اقترح لي نكهة معسل رائعة',
  'أفضل أجهزة الفيب للمبتدئين',
  'أنسب هدية راقية أقدمها',
  'عطر فاخر للمناسبات',
  'طعام مناسب لقطتي أو طيوري',
];

const BASHA_PERSONA = 'أنت مساعد ذكي لعالم الباشا للتسوق — سوق متكامل من خمسة أقسام: الباشا شيشة (معسلات شيشة، فحم، قصدير، مستلزمات التدخين)، الباشا بوتيك (هدايا، تحف، زهور)، الباشا بيرفيوم (عطور فاخرة)، الباشا فيب (أجهزة فيب، نكهات، سوائل، قطع غيار، سحبات جاهزة)، الباشا بيتس (طعام حيوانات أليفة وطيور). ساعد العملاء في اختيار المنتج المناسب لاحتياجهم وميزانيتهم، وقارن بين الموديلات والمواصفات. أجب بعربية راقية وموجزة لا تتجاوز 100 كلمة.';

const DEFAULT_SETTINGS = {
  store_name: 'عالم الباشا للتسوق',
  slogan: 'عالمك المتكامل للشيشة والبوتيك والعطور والفيب ومستلزمات الحيوانات الأليفة',
  store_type: 'basha',
  logo_url: '',
  whatsapp_number: '967776616688',
  primary_color: '#C2185B',
  price_color: '#C2185B',
  currency: 'USD',
  exchange_rates: { USD: 1, SAR: 3.75, YER_OLD: 530, YER_NEW: 1630, AED: 3.67 },
  global_price_modifier: 0,
  footer_about: 'عالم الباشا للتسوق وجهتك الأولى لكل ما تبحث عنه من معسلات شيشة وفحم وقصدير ومستلزمات التدخين، وهدايا وتحف وزهور، وعطور فاخرة، وأجهزة فيب ونكهات وسوائل وقطع غيار وسحبات جاهزة، وطعام للحيوانات الأليفة والطيور. نقدم منتجات أصلية بأسعار تنافسية وخدمة راقية.',
  footer_phone: '776616688',
  footer_email: 'info@basha-shopping.com',
  footer_address: 'صنعاء',
  copyright_text: 'جميع الحقوق محفوظة لعالم الباشا للتسوق',
  social_facebook: '',
  social_instagram: '',
  social_tiktok: '',
  social_whatsapp: 'https://wa.me/967776616688',
  theme_config: {
    primary_color: '#C2185B',
    price_color: '#C2185B',
    accent_color: '#B0BEC5',
    nav_labels: BASHA_NAV_LABELS,
    store_names: buildStoreNames(),
    store_icons: buildStoreIcons(),
    quick_suggestions: BASHA_SUGGESTIONS,
    heading_font: 'Cairo',
    body_font: 'Tajawal',
    store_themes: buildStoreThemes(),
  },
  chat_persona: BASHA_PERSONA,
};

// ─── Theme Config Helpers ─────────────────────────────────────
export function resolveThemeSettings(settings) {
  const tc = settings?.theme_config || {};
  return {
    primaryColor: tc.primary_color || settings?.primary_color || '#C2185B',
    priceColor: tc.price_color || settings?.price_color || '#C2185B',
    accentColor: tc.accent_color || '#B0BEC5',
    navLabels: tc.nav_labels || {},
    storeNames: tc.store_names || {},
    storeIcons: tc.store_icons || {},
    quickSuggestions: tc.quick_suggestions || [],
    chatPersona: settings?.chat_persona || '',
    headingFont: tc.heading_font || 'Cairo',
    bodyFont: tc.body_font || 'Tajawal',
    storeThemes: tc.store_themes || {},
  };
}

export const StoreSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const list = await base44.entities.StoreSettings.list().catch(() => []);
      if (list.length > 0) {
        setSettings({ ...DEFAULT_SETTINGS, ...list[0] });
        setSettingsId(list[0].id);
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const hexToHSL = (hex) => {
    const h = hex.startsWith('#') ? hex : '#' + hex;
    let r = parseInt(h.slice(1, 3), 16) / 255;
    let g = parseInt(h.slice(3, 5), 16) / 255;
    let b = parseInt(h.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue, sat, light = (max + min) / 2;
    if (max === min) { hue = sat = 0; }
    else {
      const d = max - min;
      sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
        case g: hue = (b - r) / d + 2; break;
        case b: hue = (r - g) / d + 4; break;
      }
      hue /= 6;
    }
    return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%`;
  };

  useEffect(() => {
    const tc = settings.theme_config || {};
    const root = document.documentElement;
    const applyVar = (varName, hex) => {
      if (!hex) return;
      const hsl = hexToHSL(hex);
      root.style.setProperty(varName, hsl);
    };
    const primaryHex = tc.primary_color || settings.primary_color || '#C2185B';
    applyVar('--primary', primaryHex);
    applyVar('--ring', primaryHex);
    applyVar('--sidebar-primary', primaryHex);
    applyVar('--sidebar-ring', primaryHex);
    const priceHex = tc.price_color || settings.price_color || '#C2185B';
    applyVar('--chart-1', priceHex);
    const accentHex = tc.accent_color || '#B0BEC5';
    applyVar('--chart-2', accentHex);
    applyVar('--accent', accentHex);
    if (tc.heading_font) {
      root.style.setProperty('--font-heading', `'${tc.heading_font}', sans-serif`);
    }
    if (tc.body_font) {
      root.style.setProperty('--font-body', `'${tc.body_font}', sans-serif`);
    }
  }, [settings.primary_color, settings.price_color, settings.theme_config]);

  useEffect(() => {
    const setMeta = (selector, attr, content) => {
      if (!content) return;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
        if (selector.includes('property')) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };
    if (settings.store_name) {
      document.title = settings.store_name;
      setMeta('meta[name="apple-mobile-web-app-title"]', 'content', settings.store_name);
      setMeta('meta[property="og:title"]', 'content', settings.store_name);
      setMeta('meta[property="og:site_name"]', 'content', settings.store_name);
    }
    if (settings.slogan) {
      setMeta('meta[name="description"]', 'content', settings.slogan);
      setMeta('meta[property="og:description"]', 'content', settings.slogan);
    }
    if (settings.logo_url) {
      setMeta('meta[property="og:image"]', 'content', settings.logo_url);
    }
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings.store_name, settings.slogan, settings.logo_url, settings.favicon_url]);

  return (
    <StoreSettingsContext.Provider value={{
      settings,
      settingsId,
      loading,
      reloadSettings: loadSettings,
    }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  }
  return ctx;
};