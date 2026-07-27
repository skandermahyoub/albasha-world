import { ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, label: 'منتجات أصلية بضمان' },
  { icon: Truck, label: 'توصيل لكل المحافظات' },
  { icon: RotateCcw, label: 'ضمان استرجاع 7 أيام' },
  { icon: Lock, label: 'دفع وتسوق آمن' },
];

export default function TrustBadgesBar() {
  return (
    <div className="px-4 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {BADGES.map((b, i) => (
          <div key={i} className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2.5">
            <b.icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[11px] font-medium leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}