import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import { useCart, useFavorites, useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Share2, Lock, Globe, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function WishLists() {
  const { isDark, toggle } = useTheme();
  const { addItem, count: cartCount } = useCart();
  const { toggleFav, isFav } = useFavorites();
  const { toggleCompare, isComparing } = useCompare();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, me, p] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.auth.me().catch(() => null),
        base44.entities.Product.list('-created_date', 1000).catch(() => []),
      ]);
      setSettings(s[0] || {});
      setAllProducts(p.filter(product => product.status === 'active'));
      setUser(me);
      if (me) {
        const wl = await base44.entities.WishList.filter({ user_email: me.email }).catch(() => []);
        setLists(wl);
        if (wl.length) setSelectedList(wl[0]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const createList = async () => {
    if (!newName.trim() || !user) return;
    const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const created = await base44.entities.WishList.create({
      user_email: user.email,
      name: newName.trim(),
      product_ids: [],
      is_public: false,
      share_token: token
    });
    const updated = [...lists, created];
    setLists(updated);
    setSelectedList(created);
    setNewName('');
    setDialogOpen(false);
    toast.success('تم إنشاء القائمة');
  };

  const deleteList = async (listId) => {
    if (!confirm('حذف هذه القائمة؟')) return;
    await base44.entities.WishList.delete(listId);
    const updated = lists.filter(l => l.id !== listId);
    setLists(updated);
    setSelectedList(updated[0] || null);
    toast.success('تم الحذف');
  };

  const togglePublic = async (list) => {
    await base44.entities.WishList.update(list.id, { is_public: !list.is_public });
    const updated = lists.map(l => l.id === list.id ? { ...l, is_public: !l.is_public } : l);
    setLists(updated);
    setSelectedList(prev => prev?.id === list.id ? { ...prev, is_public: !prev.is_public } : prev);
  };

  const copyShareLink = (list) => {
    const url = `${window.location.origin}/wishlist/${list.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ رابط المشاركة');
  };

  const listProducts = selectedList
    ? allProducts.filter(p => (selectedList.product_ids || []).includes(p.id))
    : [];

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">يرجى تسجيل الدخول</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>تسجيل الدخول</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 pb-28 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl">قوائم الرغبات</h1>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 ml-2" /> قائمة جديدة</Button>
        </div>

        <div className="flex gap-4 flex-col md:flex-row">
          {/* Lists Sidebar */}
          <div className="md:w-56 shrink-0 space-y-2">
            {lists.map(list => (
              <motion.button
                key={list.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedList(list)}
                className={`w-full text-right px-4 py-3 rounded-xl border transition-all ${selectedList?.id === list.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 hover:border-primary/50'}`}
              >
                <p className="font-bold text-sm truncate">{list.name}</p>
                <p className={`text-xs mt-0.5 ${selectedList?.id === list.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {(list.product_ids || []).length} منتج
                </p>
              </motion.button>
            ))}
            {lists.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد قوائم بعد</p>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1">
            {selectedList ? (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-heading font-bold text-lg">{selectedList.name}</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => togglePublic(selectedList)}>
                      {selectedList.is_public ? <><Globe className="w-4 h-4 ml-1" /> عامة</> : <><Lock className="w-4 h-4 ml-1" /> خاصة</>}
                    </Button>
                    {selectedList.is_public && (
                      <Button variant="outline" size="sm" onClick={() => copyShareLink(selectedList)}>
                        <Share2 className="w-4 h-4 ml-1" /> مشاركة
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteList(selectedList.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {listProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground mb-4">القائمة فارغة</p>
                    <Link to="/shop"><Button>تصفح المتجر</Button></Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {listProducts.map(p => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onAddCart={addItem}
                        onToggleFav={toggleFav}
                        onToggleCompare={toggleCompare}
                        isFav={isFav(p.id)}
                        isComparing={isComparing(p.id)}
                        format={currency.format}
                        settings={settings}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">اختر قائمة أو أنشئ واحدة جديدة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>قائمة رغبات جديدة</DialogTitle></DialogHeader>
          <Input placeholder="اسم القائمة" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createList()} />
          <Button onClick={createList} className="w-full">إنشاء</Button>
        </DialogContent>
      </Dialog>

      <Footer settings={settings} />
      <BottomNav settings={settings} />
    </div>
  );
}