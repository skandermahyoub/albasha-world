import { Check, Clock, Package, Truck, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'قيد المراجعة', icon: Clock },
  { key: 'confirmed', label: 'تم التأكيد', icon: Check },
  { key: 'preparing', label: 'قيد التجهيز', icon: Package },
  { key: 'shipped', label: 'تم الشحن', icon: Truck },
  { key: 'delivered', label: 'تم التسليم', icon: Check },
];

export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled' || order.status === 'returned') return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-2 text-sm text-destructive"><XCircle className="w-5 h-5" />{order.status === 'returned' ? 'تم إرجاع الطلب' : 'تم إلغاء الطلب'}</div>;
  const history = order.status_history || [];
  const current = Math.max(0, STEPS.findIndex(step => step.key === order.status));
  return <div className="space-y-0">{STEPS.map((step, index) => {
    const done = index <= current; const entry = history.find(item => item.status === step.key); const Icon = step.icon;
    return <div key={step.key} className="flex gap-3 min-h-14"><div className="flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}><Icon className="w-4 h-4" /></div>{index < STEPS.length - 1 && <div className={`w-0.5 flex-1 ${index < current ? 'bg-primary' : 'bg-border'}`} />}</div><div className="pt-1"><p className={`text-sm font-bold ${index === current ? 'text-primary' : ''}`}>{step.label}</p>{entry?.date && <p className="text-[11px] text-muted-foreground">{new Date(entry.date).toLocaleString('ar-SA')}</p>}</div></div>;
  })}</div>;
}