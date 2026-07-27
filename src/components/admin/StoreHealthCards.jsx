import { TrendingUp, TrendingDown, Wallet, PackageX, PackageSearch } from 'lucide-react';

/**
 * Displays store health cards.
 * Accepts PRE-FORMATTED string values for all financial indicators
 * to avoid hardcoded currency symbols.
 */
export default function StoreHealthCards({ revenueLabel, expensesLabel, profitLabel, lowStockCount, deadStockCount }) {
  const cards = [
    { label: 'صافي الإيرادات', value: revenueLabel, icon: TrendingUp, color: 'text-orange-600' },
    { label: 'النفقات التشغيلية', value: expensesLabel, icon: TrendingDown, color: 'text-red-600' },
    { label: 'الربح التقديري', value: profitLabel, icon: Wallet, color: profitLabel?.startsWith('-') ? 'text-red-600' : 'text-orange-600' },
    { label: 'منتجات على وشك النفاد', value: lowStockCount, icon: PackageX, color: 'text-orange-500' },
    { label: 'منتجات راكدة (بدون مبيعات)', value: deadStockCount, icon: PackageSearch, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-card border border-border rounded-xl p-4">
          <div className={`flex items-center gap-2 mb-1 ${c.color}`}>
            <c.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}