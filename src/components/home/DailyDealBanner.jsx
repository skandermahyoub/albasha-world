import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DailyDealBanner({ products = [], format }) {
  const withDiscount = products.filter(p => p.old_price && p.old_price > p.price);
  if (withDiscount.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86400000) % withDiscount.length;
  const deal = withDiscount[dayIndex];
  const discount = Math.round((1 - deal.price / deal.old_price) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-4 mt-6 rounded-2xl overflow-hidden bg-gradient-to-l from-primary to-primary/70 text-primary-foreground relative"
    >
      <Link to={`/product/${deal.id}`} className="flex items-center gap-4 p-4">
        <img src={deal.image} alt={deal.title} loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0 border-2 border-white/30" />
        <div className="flex-1 min-w-0">
          <span className="flex items-center gap-1 text-xs font-bold bg-black/20 w-fit px-2 py-0.5 rounded-full mb-1">
            <Zap className="w-3 h-3" /> عرض اليوم فقط
          </span>
          <h3 className="font-heading font-bold text-sm truncate">{deal.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold">{format(deal.price)}</span>
            <span className="text-xs line-through opacity-70">{format(deal.old_price)}</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">خصم {discount}%</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}