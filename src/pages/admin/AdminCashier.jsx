import { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  Minus,
  PackagePlus,
  Plus,
  Printer,
  RotateCcw,
  ScanBarcode,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';
import { getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';

const tabClasses = (active) =>
  `flex-1 min-w-[110px] rounded-xl px-3 py-3 text-sm font-bold transition-all flex flex-col items-center gap-1 ${active ? 'bg-primary text-primary-foreground shadow' : 'bg-card border border-border text-muted-foreground hover:bg-accent'}`;

export default function AdminCashier() {
  const { settings } = useStoreSettings();
  const STORES = getStores(settings?.theme_config || {});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [shift, setShift] = useState(null);
  const [activeTab, setActiveTab] = useState('sell');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState('sell');
  const [saving, setSaving] = useState(false);
  const [restockSelected, setRestockSelected] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [quickProduct, setQuickProduct] = useState(null);
  const [returnOrderNumber, setReturnOrderNumber] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [discount, setDiscount] = useState('');
  const [continuousScan, setContinuousScan] = useState(false);
  const inputRef = useRef(null);

  const loadData = async () => {
    const [p, c, o, m, shifts] = await Promise.all([
      base44.entities.Product.list('-created_date', 500).catch(() => []),
      base44.entities.Category.list('sort_order').catch(() => []),
      base44.entities.Order.list('-created_date', 120).catch(() => []),
      base44.entities.InventoryMovement.list('-created_date', 80).catch(() => []),
      base44.entities.CashierShift.filter({ status: 'open' }, '-created_date', 1).catch(() => []),
    ]);
    setProducts(p);
    setCategories(c);
    setOrders(o);
    setMovements(m);
    setShift(shifts[0] || null);
  };

  useEffect(() => { loadData(); }, []);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return [];
    return products.filter(p =>
      p.sku?.toLowerCase() === text ||
      p.title?.toLowerCase().includes(text) ||
      p.brand?.toLowerCase().includes(text)
    ).slice(0, 8);
  }, [products, query]);

  const todayOrders = orders.filter(order => {
    const d = new Date(order.created_date || Date.now());
    const now = new Date();
    return d.toDateString() === now.toDateString() && order.source === 'cashier';
  });

  const todayMovements = movements.filter(m => {
    const d = new Date(m.created_date || Date.now());
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const stats = {
    sales: todayOrders.filter(o => o.status !== 'returned' && o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
    invoices: todayOrders.filter(o => o.status !== 'returned' && o.status !== 'cancelled').length,
    returns: todayOrders.filter(o => o.status === 'returned').reduce((s, o) => s + (o.total || 0), 0),
    lowStock: products.filter(p => p.status === 'active' && (p.stock ?? 0) <= 5).length,
  };

  const openScanner = (target) => {
    setScannerTarget(target);
    setScannerOpen(true);
  };

  const findByBarcode = (code) => products.find(p => p.sku?.toLowerCase() === code.trim().toLowerCase());

  const handleCameraScan = (code) => {
    // في وضع المسح المستمر لا نغلق الماسح
    if (!continuousScan) setScannerOpen(false);
    const match = findByBarcode(code);
    if (scannerTarget === 'sell') {
      if (match) { addToCart(match); if (continuousScan) toast.success(`✓ ${match.title}`, { duration: 1500 }); }
      else { setQuery(code); toast.error('المنتج غير موجود'); if (!continuousScan) setScannerOpen(false); }
    }
    if (scannerTarget === 'restock') {
      if (!continuousScan) {
        if (match) pickRestock(match);
        else {
          setQuickProduct({ sku: code, title: '', price: '', stock: '', store_key: '', category_id: '' });
          toast.info('الباركود جديد، أكمل بيانات المنتج لإضافته');
        }
      } else {
        if (match) { pickRestock(match); toast.info(`تم تحديد: ${match.title}`); }
      }
    }
  };

  const addToCart = (product) => {
    const stock = product.stock ?? 0;
    if (stock <= 0) return toast.error('هذا المنتج غير متوفر في المخزون');
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= stock) {
          toast.error('لا يمكن بيع كمية أكبر من المخزون المتاح');
          return prev;
        }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, title: product.title, price: product.price || 0, quantity: 1, image: product.image, sku: product.sku, stock }];
    });
    setQuery('');
    toast.success(`أُضيف للسلة: ${product.title}`);
    inputRef.current?.focus();
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id !== productId) return item;
      const nextQty = Math.max(1, item.quantity + delta);
      if (nextQty > (item.stock ?? 0)) {
        toast.error('لا يمكن بيع كمية أكبر من المخزون المتاح');
        return item;
      }
      return { ...item, quantity: nextQty };
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount ? parseFloat(discount) || 0 : 0;
  const cartFinal = Math.max(0, cartTotal - discountAmount);

  const createMovement = async ({ product, type, quantity, before, after, order }) => {
    await base44.entities.InventoryMovement.create({
      product_id: product.id,
      product_title: product.title,
      sku: product.sku || '',
      type,
      quantity,
      stock_before: before,
      stock_after: after,
      unit_price: product.price || 0,
      total: (product.price || 0) * Math.abs(quantity),
      order_id: order?.id || '',
      order_number: order?.order_number || '',
      shift_id: shift?.id || '',
    });
  };

  const printInvoice = (order, silent = false) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('POS INVOICE', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Invoice: ${order.order_number}`, 15, 28);
    doc.text(`Date: ${new Date().toLocaleString()}`, 15, 35);
    doc.text(`Customer: ${order.customer_name || 'Cash Customer'}`, 15, 42);
    let y = 55;
    doc.text('Item', 15, y);
    doc.text('Qty', 105, y);
    doc.text('Price', 130, y);
    doc.text('Total', 165, y);
    y += 5;
    doc.line(15, y, 195, y);
    y += 8;
    order.items.forEach(item => {
      doc.text(String(item.title).slice(0, 35), 15, y);
      doc.text(String(item.quantity), 108, y);
      doc.text(`${Number(item.price).toFixed(2)} $`, 130, y);
      doc.text(`${Number(item.price * item.quantity).toFixed(2)} $`, 165, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.line(15, y, 195, y);
    y += 10;
    doc.setFontSize(13);
    doc.text(`TOTAL: ${Number(order.total).toFixed(2)} $`, 165, y);
    doc.save(`invoice-${order.order_number}.pdf`);
  };

  const checkout = async () => {
    if (!shift) return toast.error('افتح وردية قبل البيع');
    if (cart.length === 0) return toast.error('السلة فارغة');
    const overStock = cart.find(item => item.quantity > (item.stock ?? 0));
    if (overStock) return toast.error(`كمية ${overStock.title} أكبر من المخزون`);
    setSaving(true);
    try {
      const res = await base44.functions.invoke('process-pos-sale', {
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        payment_method: paymentMethod,
        discount: discountAmount,
        shift_id: shift.id,
        idempotency_key: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });
      if (!res.data?.success) {
        toast.error(res.data?.error || 'فشل إتمام البيع');
        setSaving(false);
        return;
      }
      const order = res.data.order;
      toast.success('تم البيع وتسجيل المخزون والحسابات بنجاح');
      printInvoice(order);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount('');
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'فشل إتمام البيع');
    }
    setSaving(false);
  };

  const pickRestock = (product) => {
    setRestockSelected(product);
    setQuickProduct(null);
    setRestockQty('');
    setQuery('');
  };

  const restockExisting = async () => {
    const qty = parseInt(restockQty);
    if (!restockSelected || !qty || qty <= 0) return toast.error('أدخل كمية صحيحة');
    setSaving(true);
    try {
      const before = restockSelected.stock || 0;
      const after = before + qty;
      await base44.entities.Product.update(restockSelected.id, { stock: after });
      await createMovement({ product: restockSelected, type: 'restock', quantity: qty, before, after });
      toast.success(`تمت إضافة ${qty} قطعة إلى المخزون`);
      setRestockSelected(null);
      setRestockQty('');
      await loadData();
    } catch (err) {
      toast.error('فشل تحديث المخزون');
    }
    setSaving(false);
  };

  const createQuickProduct = async () => {
    const qty = parseInt(quickProduct?.stock || '0');
    const price = parseFloat(quickProduct?.price || '0');
    if (!quickProduct?.title) return toast.error('أدخل اسم المنتج');
    if (!price || price <= 0) return toast.error('أدخل السعر بالدولار');
    if (!qty || qty <= 0) return toast.error('أدخل كمية المخزون');
    if (!quickProduct?.store_key || !quickProduct?.category_id) return toast.error('اختر المتجر والتصنيف');
    setSaving(true);
    try {
      const product = await base44.entities.Product.create({
        title: quickProduct.title,
        sku: quickProduct.sku,
        price,
        stock: qty,
        store_key: quickProduct.store_key,
        category_id: quickProduct.category_id,
        status: 'active',
      });
      await createMovement({ product, type: 'restock', quantity: qty, before: 0, after: qty });
      toast.success('تم إنشاء المنتج وتسجيل المخزون');
      setQuickProduct(null);
      await loadData();
    } catch (err) {
      toast.error('فشل إنشاء المنتج');
    }
    setSaving(false);
  };

  const processReturn = async () => {
    if (!returnOrderNumber.trim()) return toast.error('أدخل رقم الفاتورة');
    setSaving(true);
    try {
      const res = await base44.functions.invoke('process-pos-return', { order_number: returnOrderNumber.trim(), note: returnNote.trim() });
      if (!res.data?.success) {
        toast.error(res.data?.error || 'فشل تسجيل المرتجع');
        setSaving(false);
        return;
      }
      toast.success('تم تسجيل المرتجع وعكس المخزون والحسابات');
      setReturnOrderNumber('');
      setReturnNote('');
      await loadData();
    } catch (err) {
      toast.error(err?.message || 'فشل تسجيل المرتجع');
    }
    setSaving(false);
  };

  const openShift = async () => {
    const amount = parseFloat(openingCash || '0') || 0;
    setSaving(true);
    try {
      const newShift = await base44.entities.CashierShift.create({
        shift_number: `SHIFT-${Date.now().toString().slice(-8)}`,
        status: 'open',
        opened_at: new Date().toISOString(),
        opening_cash: amount,
      });
      setShift(newShift);
      setOpeningCash('');
      toast.success('تم فتح الوردية');
      await loadData();
    } catch (err) {
      toast.error('فشل فتح الوردية');
    }
    setSaving(false);
  };

  const closeShift = async () => {
    if (!shift) return;
    const amount = parseFloat(closingCash || '0') || 0;
    setSaving(true);
    try {
      const shiftOrders = orders.filter(o => o.shift_id === shift.id && o.status !== 'returned' && o.status !== 'cancelled');
      const shiftReturns = orders.filter(o => o.shift_id === shift.id && o.status === 'returned');
      await base44.entities.CashierShift.update(shift.id, {
        status: 'closed',
        closed_at: new Date().toISOString(),
        closing_cash: amount,
        total_sales: shiftOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders_count: shiftOrders.length,
        returns_total: shiftReturns.reduce((s, o) => s + (o.total || 0), 0),
      });
      setShift(null);
      setClosingCash('');
      toast.success('تم إغلاق الوردية');
      await loadData();
    } catch (err) {
      toast.error('فشل إغلاق الوردية');
    }
    setSaving(false);
  };

  const handleEnter = (e, action) => {
    if (e.key === 'Enter') action();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl">نظام الكاشير العملي</h1>
            <p className="text-sm text-muted-foreground">اختر المسار، امسح الباركود، والنظام يسجل البيع والمخزون والوردية تلقائياً.</p>
          </div>
          <div className={`rounded-xl px-3 py-2 text-sm font-bold ${shift ? 'bg-orange-500/10 text-orange-600' : 'bg-orange-500/10 text-orange-600'}`}>
            {shift ? `وردية مفتوحة: ${shift.shift_number}` : 'لا توجد وردية مفتوحة'}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button onClick={() => setActiveTab('sell')} className={tabClasses(activeTab === 'sell')}><ShoppingCart className="w-5 h-5" /> بيع</button>
          <button onClick={() => setActiveTab('restock')} className={tabClasses(activeTab === 'restock')}><PackagePlus className="w-5 h-5" /> مخزون</button>
          <button onClick={() => setActiveTab('returns')} className={tabClasses(activeTab === 'returns')}><RotateCcw className="w-5 h-5" /> مرتجع</button>
          <button onClick={() => setActiveTab('shift')} className={tabClasses(activeTab === 'shift')}><Clock className="w-5 h-5" /> وردية</button>
          <button onClick={() => setActiveTab('reports')} className={tabClasses(activeTab === 'reports')}><BarChart3 className="w-5 h-5" /> تقارير</button>
        </div>
      </div>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleCameraScan} continuous={continuousScan && scannerTarget === 'sell'} />

      {activeTab === 'sell' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {!shift && <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-sm text-orange-600 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> افتح وردية من تبويب الوردية قبل إتمام البيع.</div>}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">1</span> امسح الباركود أو ابحث عن المنتج</div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
                  <input type="checkbox" checked={continuousScan} onChange={e => setContinuousScan(e.target.checked)} className="accent-primary" />
                  مسح متواصل
                </label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => handleEnter(e, () => results.length === 1 && addToCart(results[0]))} placeholder="باركود / اسم المنتج" className="pr-9 h-12 text-base" />
                </div>
                <Button type="button" variant={continuousScan ? 'default' : 'outline'} onClick={() => openScanner('sell')} className="h-12 gap-1.5"><Camera className="w-4 h-4" /> {continuousScan ? 'مسح متواصل' : 'كاميرا'}</Button>
              </div>
              {results.length > 0 && <ProductResults results={results} onPick={addToCart} />}
            </div>
            <CartBox cart={cart} updateQty={updateQty} removeItem={(id) => setCart(prev => prev.filter(i => i.product_id !== id))} />
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">2</span> بيانات الفاتورة</div>
              <Input placeholder="اسم العميل (اختياري)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input placeholder="رقم الهاتف (اختياري)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              <Input type="number" placeholder="خصم (اختياري بالدولار)" value={discount} onChange={e => setDiscount(e.target.value)} />
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="transfer">تحويل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 sticky top-4">
              <div className="flex items-center gap-2 text-sm font-bold"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">3</span> إتمام البيع</div>
              {discountAmount > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>قبل الخصم</span><span>{cartTotal.toFixed(2)} $</span></div>}
              {discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>خصم</span><span>- {discountAmount.toFixed(2)} $</span></div>}
              <div className="flex justify-between text-xl font-bold"><span>الإجمالي</span><span className="text-primary">{cartFinal.toFixed(2)} $</span></div>
              <Button className="w-full h-12 text-base" onClick={checkout} disabled={saving || !shift || cart.length === 0}><Printer className="w-5 h-5 ml-2" /> {saving ? 'جارٍ الحفظ...' : 'بيع وطباعة الفاتورة'}</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'restock' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-heading font-bold text-xl">إضافة مخزون بالباركود</h2>
            <p className="text-sm text-muted-foreground">امسح باركود منتج موجود لزيادة كميته، أو امسح باركود جديد لإنشاء المنتج بسرعة.</p>
            <div className="flex gap-2">
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="باركود / اسم المنتج" className="h-12" />
              <Button variant="outline" onClick={() => openScanner('restock')} className="h-12"><Camera className="w-4 h-4 ml-1" /> كاميرا</Button>
            </div>
            {results.length > 0 && <ProductResults results={results} onPick={pickRestock} />}
          </div>
          {restockSelected && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-bold">زيادة مخزون: {restockSelected.title}</h3>
              <p className="text-sm text-muted-foreground">المخزون الحالي: {restockSelected.stock ?? 0}</p>
              <Input type="number" placeholder="الكمية المضافة" value={restockQty} onChange={e => setRestockQty(e.target.value)} />
              <Button onClick={restockExisting} disabled={saving} className="w-full"><PackagePlus className="w-4 h-4 ml-2" /> تأكيد إضافة المخزون</Button>
            </div>
          )}
          {quickProduct && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 lg:col-span-2">
              <h3 className="font-bold">إنشاء منتج سريع للباركود: {quickProduct.sku}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="اسم المنتج" value={quickProduct.title} onChange={e => setQuickProduct(p => ({ ...p, title: e.target.value }))} />
                <Input type="number" placeholder="السعر بالدولار" value={quickProduct.price} onChange={e => setQuickProduct(p => ({ ...p, price: e.target.value }))} />
                <Input type="number" placeholder="كمية المخزون" value={quickProduct.stock} onChange={e => setQuickProduct(p => ({ ...p, stock: e.target.value }))} />
                <Select value={quickProduct.store_key} onValueChange={v => setQuickProduct(p => ({ ...p, store_key: v, category_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المتجر" /></SelectTrigger>
                  <SelectContent>{STORES.map(s => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={quickProduct.category_id} onValueChange={v => setQuickProduct(p => ({ ...p, category_id: v }))} disabled={!quickProduct.store_key}>
                  <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                  <SelectContent>{categories.filter(c => c.store_key === quickProduct.store_key).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={createQuickProduct} disabled={saving}><CheckCircle className="w-4 h-4 ml-2" /> إنشاء المنتج وتسجيل المخزون</Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-xl">
          <h2 className="font-heading font-bold text-xl">تسجيل مرتجع</h2>
          <p className="text-sm text-muted-foreground">أدخل رقم فاتورة POS ليتم تحويلها إلى مرتجع وإرجاع كمياتها للمخزون.</p>
          <Input placeholder="رقم الفاتورة مثل POS-12345678" value={returnOrderNumber} onChange={e => setReturnOrderNumber(e.target.value)} />
          <Textarea placeholder="سبب المرتجع / ملاحظة" value={returnNote} onChange={e => setReturnNote(e.target.value)} />
          <Button onClick={processReturn} disabled={saving} className="w-full"><RotateCcw className="w-4 h-4 ml-2" /> تأكيد المرتجع</Button>
        </div>
      )}

      {activeTab === 'shift' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-heading font-bold text-xl">فتح الوردية</h2>
            <Input type="number" placeholder="المبلغ الموجود في الصندوق عند الفتح" value={openingCash} onChange={e => setOpeningCash(e.target.value)} disabled={!!shift} />
            <Button onClick={openShift} disabled={saving || !!shift} className="w-full"><Clock className="w-4 h-4 ml-2" /> فتح وردية جديدة</Button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h2 className="font-heading font-bold text-xl">إغلاق الوردية</h2>
            <p className="text-sm text-muted-foreground">مبيعات اليوم: {stats.sales.toFixed(2)} $ · عدد الفواتير: {stats.invoices}</p>
            <Input type="number" placeholder="المبلغ الموجود في الصندوق عند الإغلاق" value={closingCash} onChange={e => setClosingCash(e.target.value)} disabled={!shift} />
            <Button onClick={closeShift} disabled={saving || !shift} variant="outline" className="w-full">إغلاق الوردية</Button>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={DollarSign} label="مبيعات اليوم" value={`${stats.sales.toFixed(2)} $`} />
            <StatCard icon={ClipboardList} label="الفواتير" value={stats.invoices} />
            <StatCard icon={RotateCcw} label="المرتجعات" value={`${stats.returns.toFixed(2)} $`} />
            <StatCard icon={AlertTriangle} label="مخزون منخفض" value={stats.lowStock} />
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border font-bold">آخر حركات المخزون</div>
            {todayMovements.length === 0 ? <p className="p-6 text-center text-muted-foreground">لا توجد حركات اليوم</p> : todayMovements.slice(0, 12).map(m => (
              <div key={m.id} className="p-3 border-b border-border flex items-center justify-between text-sm">
                <div><p className="font-bold">{m.product_title}</p><p className="text-xs text-muted-foreground">{m.type} · {m.order_number || 'بدون فاتورة'}</p></div>
                <span className="font-bold">{m.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductResults({ results, onPick }) {
  return (
    <div className="bg-background border border-border rounded-xl divide-y divide-border overflow-hidden">
      {results.map(product => (
        <button key={product.id} onClick={() => onPick(product)} className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-right">
          <img src={product.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=100'} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{product.title}</p>
            <p className="text-xs text-muted-foreground">{product.sku || 'بدون باركود'} · مخزون: {product.stock ?? 0}</p>
          </div>
          <span className="font-bold text-primary text-sm">{product.price || 0} $</span>
        </button>
      ))}
    </div>
  );
}

function CartBox({ cart, updateQty, removeItem }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border font-bold">سلة الفاتورة ({cart.length})</div>
      {cart.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">لا توجد منتجات في السلة بعد</p>
      ) : (
        <div className="divide-y divide-border">
          {cart.map(item => (
            <div key={item.product_id} className="flex items-center gap-3 p-3">
              <img src={item.image || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=100'} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.price} $ × {item.quantity}</p></div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => updateQty(item.product_id, -1)}><Minus className="w-3 h-3" /></Button>
                <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => updateQty(item.product_id, 1)}><Plus className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => removeItem(item.product_id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <Icon className="w-5 h-5 text-primary mb-3" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}