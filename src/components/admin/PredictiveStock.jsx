import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingDown, Package, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// تحليل تنبؤي بسيط: يحسب معدل البيع التقريبي ويقدّر أيام نفاد المخزون
export default function PredictiveStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list().catch(() => []),
      base44.entities.StoreSettings.list().catch(() => []),
    ]).then(([products, settings]) => {
      setWhatsapp(settings[0]?.footer_phone || settings[0]?.whatsapp_number || '');
      const analyzed = products
        .filter(p => typeof p.stock === 'number' && p.stock >= 0)
        .map(p => {
          const sales = p.sales_count || 0;
          // تقدير معدل البيع اليومي (افتراض أن المبيعات تراكمت خلال 30 يوماً)
          const dailyRate = sales > 0 ? sales / 30 : 0.1;
          const daysLeft = dailyRate > 0 ? Math.round(p.stock / dailyRate) : 999;
          return { ...p, daysLeft, dailyRate };
        })
        .filter(p => p.daysLeft <= 14)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 8);
      setItems(analyzed);
      setLoading(false);
    });
  }, []);

  const orderSupply = (product) => {
    if (!whatsapp) return;
    const msg = `طلب توريد سريع 📦%0A%0Aالمنتج: ${product.title}%0Aالمخزون الحالي: ${product.stock}%0Aمتوقع النفاد خلال: ${product.daysLeft} يوم%0Aالكمية المطلوبة: `;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  if (loading) return <div className="bg-card rounded-xl p-5 border border-border/50"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="bg-card rounded-xl p-5 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-heading font-bold">تنبؤ المخزون الذكي</h3>
          <p className="text-xs text-muted-foreground">منتجات قد تنفد قريباً</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">✅ المخزون بحالة جيدة، لا توجد منتجات معرّضة للنفاد</p>
      ) : (
        <div className="space-y-2">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30"
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.image ? (
                  <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{p.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AlertTriangle className={`w-3 h-3 ${p.daysLeft <= 3 ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className={`text-xs font-medium ${p.daysLeft <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                      ينفد خلال {p.daysLeft} يوم • متبقي {p.stock}
                    </span>
                  </div>
                </div>
              </div>
              {whatsapp && (
                <button
                  onClick={() => orderSupply(p)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-500/20 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> توريد
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}