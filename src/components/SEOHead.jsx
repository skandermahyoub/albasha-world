import { useEffect } from 'react';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function SEOHead({ title, description, image, url }) {
  const { settings } = useStoreSettings();
  const storeName = settings?.store_name || 'متجري';
  const slogan = settings?.slogan || '';

  useEffect(() => {
    // Title
    const fullTitle = title ? `${title} | ${storeName}` : (slogan ? `${storeName} - ${slogan}` : storeName);
    document.title = fullTitle;

    const setMeta = (name, content, property = false) => {
      if (!content) return;
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description || slogan || `${storeName} - متجر إلكتروني متكامل`);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:url', url || window.location.href, true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
  }, [title, description, image, url, storeName, slogan]);

  return null;
}