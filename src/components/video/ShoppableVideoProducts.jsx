import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShoppableVideoProducts({ video, products }) {
  if (!video || products.length === 0) return null;
  const q = `${video.title || ''} ${video.description || ''}`.toLowerCase();
  const matched = products.filter(p =>
    (video.category && p.store_key === video.category) ||
    (p.title && q.includes(p.title.toLowerCase())) ||
    (p.brand && q.includes(p.brand.toLowerCase()))
  ).slice(0, 3);
  if (matched.length === 0) return null;

  return (
    <div className="p-4 border-t border-white/10 bg-black">
      <div className="flex items-center gap-2 mb-3 text-white">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <h4 className="font-heading font-bold text-sm">منتجات ظهرت أو تناسب هذا الفيديو</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {matched.map(p => (
          <Link key={p.id} to={`/product/${p.id}`} className="bg-white/10 hover:bg-white/15 rounded-xl p-2 flex gap-2 transition-colors">
            <img src={p.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200'} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate">{p.title}</p>
              <Button size="sm" className="h-7 mt-1 text-xs w-full">عرض المنتج</Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}