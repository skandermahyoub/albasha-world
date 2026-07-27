import { Clock } from 'lucide-react';

export default function FlashTimer({ endDate, label = 'ينتهي العرض بتاريخ' }) {
  if (!endDate) return null;
  const date = new Date(endDate);
  if (isNaN(date.getTime())) return null;
  if (date < new Date()) return null; // انتهى العرض → يعود السعر تلقائياً (لا يظهر شيئ)

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 border border-border/50 rounded-lg px-2.5 py-1.5 w-fit">
      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
      <span>{label}: <span className="font-bold text-foreground" dir="ltr">{d}/{m}/{y}</span></span>
    </div>
  );
}