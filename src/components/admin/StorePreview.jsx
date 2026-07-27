import { Search, Heart, ShoppingCart, Home, Package } from 'lucide-react';
import { STORE_NAMES, resolveStoreKey } from '@/lib/storeSections';

export default function StorePreview({ theme, storeKey }) {
  if (!theme || !storeKey) return null;
  const store = theme.store_themes?.[storeKey] || {};
  const color = store.primary_color || '#C2185B';
  const font = store.font || theme.heading_font || 'Cairo';
  const bodyFont = theme.body_font || 'Tajawal';
  const logo = store.logo_url;
  const name = STORE_NAMES[resolveStoreKey(storeKey)] || storeKey;

  return (
    <div className="rounded-2xl border-2 border-border/50 overflow-hidden bg-background shadow-xl">
      <div className="bg-secondary/50 px-3 py-1 flex items-center justify-between text-[9px] text-muted-foreground">
        <span>9:41</span>
        <span className="text-primary font-medium">● معاينة مباشرة</span>
        <span>100%</span>
      </div>

      {/* Store header */}
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: color }}>
        {logo ? (
          <img src={logo} alt="" className="w-7 h-7 rounded-lg object-cover bg-white/20" />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs">📦</div>
        )}
        <span className="text-white font-bold text-xs" style={{ fontFamily: `'${font}', sans-serif` }}>{name}</span>
        <div className="mr-auto flex gap-2">
          <Search className="w-3.5 h-3.5 text-white/80" />
          <Heart className="w-3.5 h-3.5 text-white/80" />
        </div>
      </div>

      {/* Hero banner */}
      <div className="mx-2 mt-2 h-14 rounded-lg flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
        <span className="text-white text-[10px] font-bold" style={{ fontFamily: `'${font}', sans-serif` }}>عروض حصرية</span>
        <span className="text-white/80 text-[8px]" style={{ fontFamily: `'${bodyFont}', sans-serif` }}>اكتشف أحدث المنتجات</span>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-lg overflow-hidden border border-border/30">
            <div className="aspect-square bg-secondary flex items-center justify-center text-xl">📦</div>
            <div className="p-1.5">
              <p className="text-[8px] font-bold truncate" style={{ fontFamily: `'${font}', sans-serif` }}>منتج تجريبي {i}</p>
              <p className="text-[7px] text-muted-foreground truncate" style={{ fontFamily: `'${bodyFont}', sans-serif` }}>وصف مختصر</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] font-bold" style={{ color }}>$ {i * 15}</span>
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                  <ShoppingCart className="w-2 h-2 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around py-2 border-t border-border/30 bg-card">
        <Home className="w-4 h-4" style={{ color }} />
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          <Package className="w-3 h-3 text-white" />
        </div>
        <Heart className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}