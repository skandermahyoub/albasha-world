import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { STORE_NAMES, resolveStoreKey } from '@/lib/storeSections';

const STORE_LABELS = STORE_NAMES;

export default function StockAlertMonitor() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [checking, setChecking] = useState(false);
  const alertedRef = useRef(new Set());

  const checkStock = async (silent = false) => {
    setChecking(true);
    try {
      const products = await base44.entities.Product.list('-created_date', 500);
      const lowStock = products.filter(p =>
        p.stock != null &&
        p.stock_alert_threshold != null &&
        p.stock <= p.stock_alert_threshold &&
        p.status === 'active'
      );

      const newAlerts = lowStock.filter(p => !alertedRef.current.has(p.id));

      if (newAlerts.length > 0 && !silent) {
        newAlerts.forEach(p => alertedRef.current.add(p.id));
        if (newAlerts.length === 1) {
          toast.error(`⚠️ مخزون منخفض: ${newAlerts[0].title}`, {
            description: `المتبقي ${newAlerts[0].stock} قطع — الحد الأدنى ${newAlerts[0].stock_alert_threshold}`,
            duration: 8000,
          });
        } else {
          toast.error(`⚠️ ${newAlerts.length} منتج بمخزون منخفض`, {
            description: newAlerts.slice(0, 4).map(p => `• ${p.title}: ${p.stock} متبقي`).join('\n'),
            duration: 8000,
          });
        }
      }

      lowStock.forEach(p => alertedRef.current.add(p.id));
      const lowStockIds = new Set(lowStock.map(p => p.id));
      [...alertedRef.current].forEach(id => {
        if (!lowStockIds.has(id)) alertedRef.current.delete(id);
      });

      setLowStockItems(lowStock);
    } catch {}
    setChecking(false);
  };

  useEffect(() => {
    checkStock(true);
    const interval = setInterval(() => checkStock(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (lowStockItems.length === 0) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span className="font-bold text-sm text-destructive">تنبيهات المخزون المنخفض</span>
          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-bold">{lowStockItems.length}</span>
        </div>
        <button onClick={() => checkStock()} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {lowStockItems.map(p => (
          <Link key={p.id} to="/admin/products" className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-destructive/5 transition-colors">
            <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate font-medium">{p.title}</span>
            {p.store_key && <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded">{STORE_LABELS[p.store_key] || p.store_key}</span>}
            <span className="text-destructive font-bold whitespace-nowrap">{p.stock} متبقي</span>
          </Link>
        ))}
      </div>
    </div>
  );
}