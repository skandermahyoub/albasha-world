import { Home, LayoutGrid, Newspaper, Star, Trophy, Image, Video, Phone, Tag } from 'lucide-react';
import { resolveIcon } from '@/lib/storePresets';
import { STORE_SECTIONS, resolveStoreKey, getStoreColor } from '@/lib/storeSections';

// ─── Static Defaults ────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'الرئيسية', to: '/', icon: Home },
  { label: 'جميع المنتجات', to: '/shop', icon: LayoutGrid },
  ...STORE_SECTIONS.map(s => ({
    label: s.nameAr,
    to: s.route,
    icon: s.icon,
  })),
  { label: 'المجلة', to: '/blog', icon: Newspaper },
  { label: 'نقاط الولاء', to: '/loyalty', icon: Star },
  { label: 'المسابقات', to: '/contests', icon: Trophy },
  { label: 'المعرض', to: '/gallery', icon: Image },
  { label: 'الفيديو', to: '/videos', icon: Video },
  { label: 'بطاقات الهدايا', to: '/gift-cards', icon: Tag },
  { label: 'تواصل معنا', to: '/contact', icon: Phone },
];

// ─── Default Stores ──────────────────────────────────────────────
export const STORE_COLORS = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, s.color])
);

export const STORES = STORE_SECTIONS.map(s => ({
  key: s.key,
  icon: s.icon,
  name: s.nameAr,
  color: s.color,
}));

// ─── Dynamic Nav Links (theme_config-aware) ────────────────────
export function getNavLinks(themeConfig) {
  if (!themeConfig?.nav_labels) return NAV_LINKS;
  const labels = themeConfig.nav_labels;
  return NAV_LINKS.map(link => {
    if (link.to === '/shop' && labels.shop) return { ...link, label: labels.shop };
    if (link.to === '/blog' && labels.blog) return { ...link, label: labels.blog };
    if (link.to === '/loyalty' && labels.loyalty) return { ...link, label: labels.loyalty };
    if (link.to === '/contests' && labels.contests) return { ...link, label: labels.contests };
    if (link.to === '/gallery' && labels.gallery) return { ...link, label: labels.gallery };
    if (link.to === '/videos' && labels.videos) return { ...link, label: labels.videos };
    if (link.to === '/gift-cards' && labels.gift_cards) return { ...link, label: labels.gift_cards };
    if (link.to === '/contact' && labels.contact) return { ...link, label: labels.contact };
    if (link.to === '/guide' && labels.guide) return { ...link, label: labels.guide };
    return link;
  });
}

// ─── Dynamic Stores (theme_config-aware) ───────────────────────
export function getStores(themeConfig) {
  if (!themeConfig?.store_names) return STORES;
  const names = themeConfig.store_names || {};
  const icons = themeConfig.store_icons || {};
  return STORES.map(store => ({
    ...store,
    name: names[store.key] || store.name,
    icon: icons[store.key] ? resolveIcon(icons[store.key]) : store.icon,
  }));
}

export { getStoreColor };

// ─── Store Metadata (images, descriptions) ─────────────────────
export const STORE_DETAILS = Object.fromEntries(
  STORE_SECTIONS.map(s => [s.key, {
    name: s.nameAr,
    desc: s.desc,
    fallbackImage: s.fallbackImage,
    heroImage: s.heroImage,
    bgImages: s.bgImages,
  }])
);