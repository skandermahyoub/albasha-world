import { Sparkle } from 'lucide-react';

export default function MarqueeBar({ items = [] }) {
  const activeItems = items.filter(i => i.is_active !== false);
  if (activeItems.length === 0) return null;

  const Sep = () => <Sparkle className="inline-block w-3 h-3 mx-3 -mt-0.5 fill-primary text-primary" />;

  const renderRun = (keyPrefix) => (
    <span className="inline-flex items-center">
      {activeItems.map((item, i) => (
        <span key={`${keyPrefix}-${i}`} className="inline-flex items-center">
          {item.text}
          <Sep />
        </span>
      ))}
    </span>
  );

  return (
    <div className="bg-primary/10 border-y border-primary/20 py-2.5 overflow-hidden my-6">
      <div className="flex whitespace-nowrap">
        <span className="marquee-track inline-block text-sm font-body text-primary font-medium">
          {renderRun('a')}
          {renderRun('b')}
          {renderRun('c')}
        </span>
      </div>
    </div>
  );
}