/**
 * Central source of truth for store sections.
 * All components MUST import from here — never hardcode store keys.
 *
 * Canonical keys: shisha, vape, boutique, perfume, pets
 */

import { Cigarette, Gift, Droplet, Wine, PawPrint, Tag } from 'lucide-react';

export const STORE_KEYS = ['shisha', 'vape', 'boutique', 'perfume', 'pets'];

export const STORE_SECTIONS = [
  {
    key: 'shisha',
    nameAr: 'الباشا شيشة',
    nameEn: 'Basha Shisha',
    color: '#C2185B',
    icon: Cigarette,
    iconKey: 'cigarette',
    desc: 'معسلات شيشة، فحم، قصدير، وكل مستلزمات التدخين من أجود الأنواع',
    route: '/store/shisha',
    emoji: '🚬',
    fallbackImage: 'https://images.unsplash.com/photo-1605020414-f8a7e1b468e6?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1605020414-f8a7e1b468e6?w=1200&h=400&fit=crop',
    bgImages: [
      'https://images.unsplash.com/photo-1605020414-f8a7e1b468e6?w=1200&fit=crop',
      'https://images.unsplash.com/photo-1532178446324-9471b1ba4c55?w=1200&fit=crop',
    ],
  },
  {
    key: 'boutique',
    nameAr: 'الباشا بوتيك',
    nameEn: 'Basha Boutique',
    color: '#D81B60',
    icon: Gift,
    iconKey: 'gift',
    desc: 'هدايا، تحف، زهور، وقطع مميزة لكل المناسبات والأذواق الراقية',
    route: '/store/boutique',
    emoji: '🎁',
    fallbackImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&h=400&fit=crop',
    bgImages: [
      'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&fit=crop',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&fit=crop',
    ],
  },
  {
    key: 'perfume',
    nameAr: 'الباشا بيرفيوم',
    nameEn: 'Basha Perfume',
    color: '#AD1457',
    icon: Droplet,
    iconKey: 'droplet',
    desc: 'عطور فاخرة رجالية ونسائية من أرقى الدور العالمية بتركيز عالٍ وثبات طويل',
    route: '/store/perfume',
    emoji: '💧',
    fallbackImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=400&fit=crop',
    bgImages: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&fit=crop',
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&fit=crop',
    ],
  },
  {
    key: 'vape',
    nameAr: 'الباشا فيب',
    nameEn: 'Basha Vape',
    color: '#E91E63',
    icon: Wine,
    iconKey: 'wine',
    desc: 'أجهزة فيب، نكهات، سوائل، قطع غيار، وسحبات جاهزة لكل المستويات والأذواق',
    route: '/store/vape',
    emoji: '💊',
    fallbackImage: 'https://images.unsplash.com/photo-1532178446324-9471b1ba4c55?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1532178446324-9471b1ba4c55?w=1200&h=400&fit=crop',
    bgImages: [
      'https://images.unsplash.com/photo-1532178446324-9471b1ba4c55?w=1200&fit=crop',
      'https://images.unsplash.com/photo-1606767317828-2c1c5d5c5c5c?w=1200&fit=crop',
    ],
  },
  {
    key: 'pets',
    nameAr: 'الباشا بيتس',
    nameEn: 'Basha Pets',
    color: '#F06292',
    icon: PawPrint,
    iconKey: 'pawprint',
    desc: 'طعام ومستلزمات للحيوانات الأليفة والطيور بأفضل الماركات وأسعار منافسة',
    route: '/store/pets',
    emoji: '🐾',
    fallbackImage: 'https://images.unsplash.com/photo-1589924691997-72dc4076fec2?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1589924691997-72dc4076fec2?w=1200&h=400&fit=crop',
    bgImages: [
      'https://images.unsplash.com/photo-1589924691997-72dc4076fec2?w=1200&fit=crop',
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&fit=crop',
    ],
  },
];

export const STORE_COLORS = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, s.color])
);

export const STORE_NAMES = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, s.nameAr])
);

export const STORE_ICONS = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, s.icon])
);

export const STORE_DETAILS = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, s])
);

/** Resolve a store key to one of the canonical sections. */
export function resolveStoreKey(key) {
  if (!key) return null;
  return STORE_KEYS.includes(key) ? key : null;
}

/** Get a full section object by canonical key. */
export function getStoreSection(key) {
  const resolved = resolveStoreKey(key);
  return STORE_SECTIONS.find(s => s.key === resolved) || null;
}

export function getStoreName(key) {
  return getStoreSection(key)?.nameAr || key || '';
}

export function getStoreColor(key) {
  return getStoreSection(key)?.color || '#C2185B';
}

export function getStoreIcon(key) {
  return getStoreSection(key)?.icon || Tag;
}

export function getStoreDetails(key) {
  return getStoreSection(key) || STORE_SECTIONS[0];
}

/** Build theme_config.store_names for a preset, using new keys */
export function buildStoreNames() {
  return Object.fromEntries(STORE_SECTIONS.map(s => [s.key, s.nameAr]));
}

export function buildStoreIcons() {
  return Object.fromEntries(STORE_SECTIONS.map(s => [s.key, s.iconKey]));
}

export function buildStoreColors() {
  return Object.fromEntries(STORE_SECTIONS.map(s => [s.key, s.color]));
}

export function buildStoreThemes() {
  return Object.fromEntries(
    STORE_SECTIONS.map(s => [s.key, { logo_url: '', primary_color: s.color, font: 'Cairo' }])
  );
}