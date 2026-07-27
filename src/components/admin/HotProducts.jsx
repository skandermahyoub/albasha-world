import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Flame, Eye, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStores } from '@/lib/navLinks';

// خريطة "الأكثر تفاعلاً" - تعتمد على عدد المبيعات والمنتجات المميزة كمؤشر حرارة
export default function HotProducts() {
  const [items, setItems] = useState([]);
  const [storeNameMap, setStoreNameMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list().catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
    ]).then(([products, settings]) => {
      const stores = getStores(settings[0]?.theme_config);
      const nameMap = Object.fromEntries(stores.map(s => [s.key, s.name]));
      setStoreNameMap(nameMap);
      const scored = products
        .filter(p => p.status === 'active')
        .map(p => {
          const heat = (p.sales_count || 0) * 3 + (p.is_bestseller ? 20 : 0) + (p.is_featured ? 10 : 0) + (p.is_new ? 5 : 0);
          return { ...p, heat };
        })
        .filter(p => p.heat > 0)
        .sort((a, b) => b.heat - a.heat)
        .slice(0, 6);
      const max = scored[0]?.heat || 1;
      setItems(scored.map(p => ({ ...p, intensity: Math.round((p.heat / max) * 100) })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="bg-card rounded-xl p-5 border border-border/50"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="bg-card rounded-xl p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Flame className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-heading font-bold">الأكثر رواجاً الآن</h3>
          <p className="text-xs text-muted-foreground">خريطة حرارية للمنتجات النشطة</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">لا توجد بيانات تفاعل كافية بعد</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-xl border border-border/30"
            >
              <div
                className="absolute inset-0 bg-gradient-to-l from-red-500/15 to-orange-500/5"
                style={{ width: `${p.intensity}%` }}
              />
              <div className="relative flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg font-heading font-bold text-muted-foreground w-5">{i + 1}</span>
                  {p.image && <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">{storeNameMap[p.store_key] || ''} • {p.sales_count || 0} مبيعة</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-red-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{p.intensity}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}