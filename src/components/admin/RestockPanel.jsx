import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Camera, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';

export default function RestockPanel({ products, onStockUpdated }) {
  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [addQty, setAddQty] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const results = query.trim()
    ? products.filter(p =>
        p.sku?.toLowerCase() === query.trim().toLowerCase() ||
        p.title?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const pick = (product) => {
    setSelected(product);
    setQuery('');
    setAddQty('');
  };

  const handleScanEnter = (e) => {
    if (e.key === 'Enter' && results.length === 1) pick(results[0]);
  };

  const handleCameraScan = (code) => {
    setScannerOpen(false);
    const match = products.find(p => p.sku?.toLowerCase() === code.trim().toLowerCase());
    if (match) {
      pick(match);
      toast.success(`تم العثور على: ${match.title}`);
    } else {
      toast.error('لم يتم العثور على منتج بهذا الباركود');
      setQuery(code);
    }
  };

  const confirmAddStock = async () => {
    const qty = parseInt(addQty);
    if (!selected || !qty || qty <= 0) return toast.error('أدخل كمية صحيحة أكبر من صفر');
    setSaving(true);
    const newStock = (selected.stock || 0) + qty;
    await base44.entities.Product.update(selected.id, { stock: newStock });
    toast.success(`تم إضافة ${qty} قطعة لمخزون "${selected.title}" (الإجمالي الآن: ${newStock})`);
    setSelected(null);
    setAddQty('');
    setSaving(false);
    onStockUpdated();
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-muted-foreground flex items-center gap-2">
        <PackagePlus className="w-4 h-4 text-primary shrink-0" />
        امسح باركود المنتج الذي وصل مخزون جديد له، ثم أدخل الكمية المضافة لتحديث المخزون فوراً.
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleScanEnter}
            placeholder="امسح الباركود أو ابحث بالاسم / SKU"
            className="pr-9"
            autoFocus
          />
        </div>
        <Button type="button" variant="outline" onClick={() => setScannerOpen(true)} className="shrink-0 gap-1.5">
          <Camera className="w-4 h-4" /> مسح بالكاميرا
        </Button>
      </div>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleCameraScan} />

      {results.length > 0 && (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-right"
            >
              <img src={p.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=100'} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.sku || 'بدون باركود'} · مخزون حالي: {p.stock ?? '-'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <img src={selected.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=100'} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{selected.title}</p>
              <p className="text-xs text-muted-foreground">المخزون الحالي: {selected.stock ?? 0}</p>
            </div>
          </div>
          <Input
            type="number"
            placeholder="الكمية المضافة"
            value={addQty}
            onChange={e => setAddQty(e.target.value)}
            autoFocus
          />
          <Button onClick={confirmAddStock} disabled={saving} className="w-full">
            <PackagePlus className="w-4 h-4 ml-2" /> {saving ? 'جارٍ التحديث...' : 'تأكيد إضافة المخزون'}
          </Button>
        </div>
      )}
    </div>
  );
}