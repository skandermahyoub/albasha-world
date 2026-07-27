import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { X, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Compare() {
  const { isDark, toggle } = useTheme();
  const { compareList, toggleCompare, clearCompare } = useCompare();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [s, p] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.entities.Product.list('-created_date', 200).catch(() => []),
      ]);
      setSettings(s[0] || {});
      setProducts(p.filter(pr => compareList.includes(pr.id)));
    };
    load();
  }, [compareList]);

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={0} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6" /> المقارنة ({products.length})
          </h1>
          {products.length > 0 && <Button variant="outline" size="sm" onClick={clearCompare}>مسح الكل</Button>}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">لا توجد منتجات للمقارنة</p>
            <Link to="/shop"><Button>تصفح المتجر</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-card rounded-xl border border-border/50">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-right text-sm font-heading">المنتج</th>
                  {products.map(p => (
                    <th key={p.id} className="p-3 min-w-[200px]">
                      <div className="relative">
                        <button onClick={() => toggleCompare(p.id)} className="absolute -top-1 -left-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs"><X className="w-3 h-3" /></button>
                        <img src={p.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=200'} alt={p.title} className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
                        <p className="text-sm font-bold">{p.title}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'السعر', fn: p => currency.format(p.price) },
                  { key: 'العلامة', fn: p => p.brand || '-' },
                  { key: 'النكهة', fn: p => p.flavor || '-' },
                  { key: 'النيكوتين', fn: p => p.nicotine_level || '-' },
                  { key: 'الحالة', fn: p => p.stock > 0 ? 'متوفر' : 'غير متوفر' },
                ].map(row => (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="p-3 text-sm font-bold text-muted-foreground">{row.key}</td>
                    {products.map(p => (
                      <td key={p.id} className="p-3 text-sm text-center">{row.fn(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}