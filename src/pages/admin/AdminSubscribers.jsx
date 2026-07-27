import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Phone, MapPin, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSubscribers() {
  const [subs, setSubs] = useState([]);
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const [s, o] = await Promise.all([
      base44.entities.Subscriber.list('-created_date').catch(() => []),
      base44.entities.Order.list('-created_date', 500).catch(() => []),
    ]);
    setSubs(s);
    setOrders(o);
  };
  useEffect(() => { load(); }, []);

  const getOrderCount = (phone) => orders.filter(o => o.customer_phone === phone).length;

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">المشتركين ({subs.length})</h1>
      <div className="space-y-2">
        {subs.map(s => (
          <div key={s.id} className="bg-card rounded-lg p-3 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm">{s.name || 'بدون اسم'}</span>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>
                  {s.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.address}</span>}
                  <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> {getOrderCount(s.phone)} طلب</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={async () => { await base44.entities.Subscriber.delete(s.id); load(); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {subs.length === 0 && <p className="text-center text-muted-foreground py-10">لا يوجد مشتركين</p>}
      </div>
    </div>
  );
}