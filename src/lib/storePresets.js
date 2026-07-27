import {
  Home, LayoutGrid, Smartphone, Tablet, Headphones, RefreshCw, Tag, Newspaper, Star,
  Trophy, Image, Video, Phone, BookOpen, Monitor, Laptop,
  Shirt, Gem, Droplet, Wine, FlaskConical, Flower2, Sparkles, Crown,
  PawPrint, Carrot, Apple, Utensils, Coffee, Pizza, Beef,
  Sofa, Lamp, Car, Wrench, Zap, Battery, Cpu, Gamepad2, Camera,
  Gift, Award, Heart, ShoppingBag, Package, Palette, Brush, Scissors,
  Flame, Cigarette,
} from 'lucide-react';

// ─── Icon Registry ─────────────────────────────────────────────
export const ICON_REGISTRY = {
  home: Home, grid: LayoutGrid, smartphone: Smartphone, tablet: Tablet,
  headphones: Headphones, refresh: RefreshCw, tag: Tag, newspaper: Newspaper,
  star: Star, trophy: Trophy, image: Image, video: Video, phone: Phone,
  book: BookOpen, shirt: Shirt, gem: Gem, diamond: Gem, droplet: Droplet,
  wine: Wine, flask: FlaskConical, flower: Flower2, sparkles: Sparkles,
  crown: Crown, pawprint: PawPrint, carrot: Carrot, apple: Apple,
  utensils: Utensils, coffee: Coffee, pizza: Pizza, beef: Beef,
  sofa: Sofa, lamp: Lamp, car: Car, wrench: Wrench, zap: Zap,
  battery: Battery, monitor: Monitor, cpu: Cpu, gamepad: Gamepad2,
  camera: Camera, gift: Gift, award: Award, heart: Heart,
  shoppingbag: ShoppingBag, package: Package, palette: Palette,
  brush: Brush, scissors: Scissors, flame: Flame, cigarette: Cigarette,
  laptop: Laptop || Monitor,
};

export function resolveIcon(name) {
  return ICON_REGISTRY[name] || Tag;
}

// ─── Store Type Presets ─────────────────────────────────────────
// Only the 'basha' preset uses the canonical store keys.
// Legacy presets retain their data for backward compatibility but
// buildThemeConfig always emits basha keys.
import { STORE_SECTIONS, buildStoreNames, buildStoreIcons, buildStoreColors, buildStoreThemes } from '@/lib/storeSections';

const BASHA_NAV_LABELS = { shop: 'جميع المنتجات', blog: 'مجلة الباشا', loyalty: 'نقاط الولاء', contests: 'المسابقات', gallery: 'المعرض', videos: 'الفيديو', gift_cards: 'بطاقات الهدايا', contact: 'تواصل معنا', guide: 'دليل الاستخدام' };
const BASHA_SUGGESTIONS = ['اقترح لي نكهة معسل رائعة', 'أفضل أجهزة الفيب للمبتدئين', 'أنسب هدية راقية أقدمها', 'عطر فاخر للمناسبات', 'طعام مناسب لقطتي أو طيوري'];
const BASHA_PERSONA = 'أنت مساعد ذكي لعالم الباشا للتسوق — سوق متكامل من خمسة أقسام: الباشا شيشة (معسلات شيشة، فحم، قصدير، مستلزمات التدخين)، الباشا بوتيك (هدايا، تحف، زهور)، الباشا بيرفيوم (عطور فاخرة)، الباشا فيب (أجهزة فيب، نكهات، سوائل، قطع غيار، سحبات جاهزة)، الباشا بيتس (طعام حيوانات أليفة وطيور). ساعد العملاء في اختيار المنتج المناسب لاحتياجهم وميزانيتهم، وقارن بين الموديلات والمواصفات. أجب بعربية راقية وموجزة لا تتجاوز 100 كلمة.';

export const STORE_PRESETS = {
  basha: {
    label: 'عالم الباشا للتسوق - خمسة أقسام متكاملة',
    icon: ShoppingBag,
    primary_color: '#C2185B',
    price_color: '#C2185B',
    accent_color: '#B0BEC5',
    slogan: 'عالمك المتكامل للشيشة والبوتيك والعطور والفيب ومستلزمات الحيوانات الأليفة',
    store_colors: buildStoreColors(),
    store_names: buildStoreNames(),
    store_icons: buildStoreIcons(),
    nav_labels: BASHA_NAV_LABELS,
    quick_suggestions: BASHA_SUGGESTIONS,
    chat_persona: BASHA_PERSONA,
  },
};

// ─── Helper: Build Theme Config from Preset ────────────────────
export function buildThemeConfig(presetKey) {
  const p = STORE_PRESETS[presetKey] || STORE_PRESETS.basha;
  return {
    primary_color: p.primary_color,
    price_color: p.price_color,
    accent_color: p.accent_color,
    nav_labels: p.nav_labels,
    store_names: p.store_names,
    store_icons: p.store_icons,
    quick_suggestions: p.quick_suggestions,
  };
}

export function buildChatPersona(presetKey) {
  return STORE_PRESETS[presetKey]?.chat_persona || BASHA_PERSONA;
}

export function buildSlogan(presetKey) {
  return STORE_PRESETS[presetKey]?.slogan || STORE_PRESETS.basha.slogan;
}