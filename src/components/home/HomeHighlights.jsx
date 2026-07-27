import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const icons = { shield: ShieldCheck, truck: Truck, rotate: RotateCcw, headphones: Headphones };

export default function HomeHighlights() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.HomeHighlight.list('sort_order', 4)
      .then(records => setItems(records.filter(item => item.is_active !== false)))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section className="px-4 mt-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map(item => {
          const Icon = icons[item.icon] || ShieldCheck;
          return <div key={item.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-start gap-2.5">
            <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div><h2 className="font-heading font-bold text-xs">{item.title}</h2>{item.description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.description}</p>}</div>
          </div>;
        })}
      </div>
    </section>
  );
}