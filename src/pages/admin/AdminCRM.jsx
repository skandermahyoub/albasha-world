import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Search, Star, ShoppingBag, Phone, Mail, Plus, MessageSquare, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-700',
  platinum: 'bg-blue-100 text-blue-700',
  vip: 'bg-purple-100 text-purple-700',
};

const TIER_LABELS = {
  bronze: 'برونزي',
  silver: 'فضي',
  gold: 'ذهبي',
  platinum: 'بلاتيني',
  vip: 'VIP',
};

export default function AdminCRM() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [c, o, p] = await Promise.all([
      base44.entities.CustomerProfile.list('-created_date', 200).catch(() => []),
      base44.entities.Order.list('-created_date', 500).catch(() => []),
      base44.entities.Product.list('-created_date', 500).catch(() => []),
    ]);
    setCustomers(c);
    setOrders(o);
    setProducts(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name?.includes(search) || c.user_email?.includes(search) || c.phone?.includes(search);
    const matchRating = ratingFilter === 'all' || (c.admin_rating || 'good') === ratingFilter;
    return matchSearch && matchRating;
  }).sort((a, b) => {
    if (sortBy === 'spent') return (b.total_spent || 0) - (a.total_spent || 0);
    if (sortBy === 'orders') return (b.orders_count || 0) - (a.orders_count || 0);
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  const customerOrders = selected ? orders.filter(o => o.customer_email === selected.user_email || o.customer_phone === selected.phone) : [];

  const productStoreMap = {};
  products.forEach(p => { if (p.id) productStoreMap[p.id] = p.store_key; });

  const CRM_STORE_META = {
    shisha: { name: 'شيشة', icon: '🚬', color: '#C2185B' },
    boutique: { name: 'بوتيك', icon: '🎁', color: '#D81B60' },
    perfume: { name: 'عطور', icon: '💧', color: '#AD1457' },
    vape: { name: 'فيب', icon: '💊', color: '#E91E63' },
    pets: { name: 'بيتس', icon: '🐾', color: '#F06292' },
  };

  const storeBreakdown = {};
  customerOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const sk = productStoreMap[item.product_id];
      if (sk) {
        if (!storeBreakdown[sk]) storeBreakdown[sk] = { count: 0, spent: 0 };
        storeBreakdown[sk].count++;
        storeBreakdown[sk].spent += (item.price || 0) * (item.quantity || 1);
      }
    });
  });

  const addNote = async () => {
    if (!noteInput.trim() || !selected) return;
    const newHistory = [...(selected.interaction_history || []), {
      date: new Date().toISOString(),
      type: 'note',
      note: noteInput.trim(),
    }];
    await base44.entities.CustomerProfile.update(selected.id, {
      notes: noteInput.trim(),
      interaction_history: newHistory,
      last_interaction: new Date().toISOString(),
    });
    setNoteInput('');
    toast.success('تم إضافة الملاحظة');
    load();
    setSelected(prev => ({ ...prev, notes: noteInput.trim(), interaction_history: newHistory }));
  };

  const updateTier = async (tier) => {
    if (!selected) return;
    await base44.entities.CustomerProfile.update(selected.id, { tier });
    setSelected(prev => ({ ...prev, tier }));
    toast.success('تم تحديث درجة العضوية');
    load();
  };

  const RATING_CONFIG = {
    excellent: { label: 'ممتاز', icon: ThumbsUp, color: 'bg-green-100 text-green-700 border-green-300' },
    good: { label: 'جيد', icon: Meh, color: 'bg-blue-100 text-blue-700 border-blue-300' },
    bad: { label: 'سيئ', icon: ThumbsDown, color: 'bg-red-100 text-red-700 border-red-300' },
  };

  const updateRating = async (rating) => {
    if (!selected) return;
    await base44.entities.CustomerProfile.update(selected.id, { admin_rating: rating });
    setSelected(prev => ({ ...prev, admin_rating: rating }));
    toast.success('تم تحديث تقييم العميل');
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">نظام CRM - إدارة العملاء</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو البريد أو الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-1 mb-4 flex-wrap">
            {[{v:'all',l:'الكل'},{v:'excellent',l:'ممتاز'},{v:'good',l:'جيد'},{v:'bad',l:'سيئ'}].map(r => (
              <button key={r.v} onClick={() => setRatingFilter(r.v)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${ratingFilter === r.v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {r.l}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mb-4">
            <option value="latest">ترتيب: الأحدث</option>
            <option value="spent">ترتيب: الأعلى إنفاقاً</option>
            <option value="orders">ترتيب: الأكثر طلباً</option>
          </select>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.map(c => (
              <motion.div
                key={c.id}
                whileHover={{ x: -2 }}
                onClick={() => setSelected(c)}
                className={`bg-card rounded-xl p-3 border cursor-pointer transition-colors ${selected?.id === c.id ? 'border-primary' : 'border-border/50 hover:border-primary/30'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{c.name || c.user_email}</p>
                    <p className="text-xs text-muted-foreground truncate">#{c.customer_number || '—'} · {c.phone || c.user_email}</p>
                  </div>
                  <Badge className={`text-[10px] ${TIER_COLORS[c.tier || 'bronze']}`}>
                    {TIER_LABELS[c.tier || 'bronze']}
                  </Badge>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>🛒 {c.orders_count || 0} طلب</span>
                  <span>💰 {(c.total_spent || 0).toFixed(0)} ر.س</span>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">لا يوجد عملاء</p>}
          </div>
        </div>

        {/* Customer Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-card rounded-xl p-5 border border-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg">{selected.name || 'عميل'}</h2>
                      <div className="flex gap-2 mt-1">
                        {selected.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{selected.user_email}</span>}
                        {selected.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <Select value={selected.tier || 'bronze'} onValueChange={updateTier}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIER_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">{customerOrders.length}</p>
                    <p className="text-xs text-muted-foreground">الطلبات</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">{(selected.total_spent || 0).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">ر.س إجمالي</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-primary">{selected.preferred_store || '—'}</p>
                    <p className="text-xs text-muted-foreground">النشاط المفضل</p>
                  </div>
                </div>

                {/* Per-store breakdown */}
                {Object.keys(storeBreakdown).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">تاريخ الطلبات حسب النشاط:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(storeBreakdown).sort((a, b) => b[1].spent - a[1].spent).map(([key, data]) => {
                        const meta = CRM_STORE_META[key] || { name: key, icon: '📦', color: '#888' };
                        return (
                          <div key={key} className="flex items-center gap-2 bg-background rounded-lg p-2 border" style={{ borderColor: meta.color + '40' }}>
                            <span className="text-lg">{meta.icon}</span>
                            <div className="flex-1">
                              <p className="text-[10px] text-muted-foreground">{meta.name}</p>
                              <p className="text-xs font-bold" style={{ color: meta.color }}>{data.spent.toFixed(0)}$ · {data.count} طلب</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* تقييم الإدارة */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">تقييم الإدارة للعميل:</p>
                  <div className="flex gap-2">
                    {Object.entries(RATING_CONFIG).map(([key, cfg]) => {
                      const RatingIcon = cfg.icon;
                      const isActive = (selected.admin_rating || 'good') === key;
                      return (
                        <button key={key} onClick={() => updateRating(key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${isActive ? cfg.color : 'bg-background border-border text-muted-foreground hover:border-primary/30'}`}>
                          <RatingIcon className="w-3.5 h-3.5" /> {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Orders */}
              {customerOrders.length > 0 && (
                <div className="bg-card rounded-xl p-4 border border-border/50">
                  <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> سجل الطلبات</h3>
                  <div className="space-y-2">
                    {customerOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-bold">#{order.order_number || order.id.slice(-6)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleDateString('ar')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{order.total} ر.س</p>
                          <Badge variant="outline" className="text-[10px]">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-card rounded-xl p-4 border border-border/50">
                <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> ملاحظات الفريق</h3>
                {selected.notes && (
                  <div className="bg-accent/30 rounded-lg p-3 mb-3 text-sm">{selected.notes}</div>
                )}
                {/* History */}
                {selected.interaction_history && selected.interaction_history.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {[...selected.interaction_history].reverse().map((h, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="text-muted-foreground shrink-0">{new Date(h.date).toLocaleDateString('ar')}</span>
                        <span>{h.note}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="أضف ملاحظة..."
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={addNote} size="icon" className="self-end h-10 w-10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p>اختر عميلاً لعرض تفاصيله</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}