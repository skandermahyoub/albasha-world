import { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AISearch({ allProducts = [], format }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const q = query.toLowerCase();
    const matches = allProducts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.subtitle?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.flavor?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t?.toLowerCase().includes(q))
    );
    setResults(matches.slice(0, 12));
    setLoading(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium transition-colors"
      >
        <Search className="w-4 h-4" />
        بحث في المنتجات
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-16 left-4 right-4 z-[90] max-w-2xl mx-auto bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Search className="w-5 h-5 text-primary shrink-0" />
                <input
                  autoFocus
                  placeholder='ابحث بالاسم أو الماركة أو النكهة...'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {query && <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }}><X className="w-4 h-4 text-muted-foreground" /></button>}
                <Button size="sm" onClick={search} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Suggestions */}
              {!searched && (
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">جرب البحث عن:</p>
                  <div className="flex flex-wrap gap-2">
                    {['معسل', 'فيب', 'عطر', 'هدية', 'طعام قطط'].map(s => (
                      <button key={s} onClick={() => { setQuery(s); }} className="text-xs bg-secondary px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-2 p-6 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm">جاري البحث...</span>
                </div>
              )}

              {/* Results */}
              {searched && !loading && (
                <div className="p-4">
                  {results.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لم يتم العثور على منتجات مناسبة</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">وجدت {results.length} منتج:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                        {results.map(p => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 bg-secondary rounded-xl p-2 hover:bg-accent transition-colors"
                          >
                            <img src={p.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=100'} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{p.title}</p>
                              {p.price && format && <p className="text-xs text-primary">{format(p.price)}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}