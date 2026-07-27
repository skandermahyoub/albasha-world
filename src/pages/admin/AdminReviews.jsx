import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function StarDisplay({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [blogReviews, setBlogReviews] = useState([]);
  const [productReviews, setProductReviews] = useState([]);
  const [clientRatings, setClientRatings] = useState([]);
  const [tab, setTab] = useState('product');
  const [filter, setFilter] = useState('pending');
  const [products, setProducts] = useState([]);
  const [surveys, setSurveys] = useState([]);

  const load = async () => {
    const [br, pr, cr, p, sv] = await Promise.all([
      base44.entities.Review.list('-created_date', 200).catch(() => []),
      base44.entities.ProductReview.list('-created_date', 200).catch(() => []),
      base44.entities.ClientRating.list('-created_date', 200).catch(() => []),
      base44.entities.Product.list().catch(() => []),
      base44.entities.Survey.list('-created_date', 100).catch(() => []),
    ]);
    setBlogReviews(br);
    setProductReviews(pr);
    setClientRatings(cr);
    setProducts(p);
    setSurveys(sv);
  };

  useEffect(() => { load(); }, []);

  const getProductName = (id) => products.find(p => p.id === id)?.title || id;

  const approveBlog = async (id) => {
    await base44.entities.Review.update(id, { status: 'approved' });
    toast.success('تم الموافقة'); load();
  };
  const rejectBlog = async (id) => {
    await base44.entities.Review.update(id, { status: 'rejected' });
    toast.success('تم الرفض'); load();
  };
  const deleteBlog = async (id) => {
    await base44.entities.Review.delete(id);
    toast.success('تم الحذف'); load();
  };

  const approveProduct = async (id) => {
    await base44.entities.ProductReview.update(id, { status: 'approved' });
    toast.success('تم الموافقة'); load();
  };
  const rejectProduct = async (id) => {
    await base44.entities.ProductReview.update(id, { status: 'rejected' });
    toast.success('تم الرفض'); load();
  };
  const deleteProduct = async (id) => {
    await base44.entities.ProductReview.delete(id);
    toast.success('تم الحذف'); load();
  };

  const filteredBlog = blogReviews.filter(r => filter === 'all' || r.status === filter);
  const filteredProduct = productReviews.filter(r => filter === 'all' || r.status === filter);

  const pendingBlog = blogReviews.filter(r => r.status === 'pending').length;
  const pendingProduct = productReviews.filter(r => r.status === 'pending').length;
  const pendingClient = clientRatings.filter(r => r.status === 'pending').length;
  const filteredClient = clientRatings.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">إدارة التقييمات والمراجعات</h1>
        <p className="text-sm text-muted-foreground">{pendingBlog + pendingProduct + pendingClient} بانتظار الموافقة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary rounded-xl p-1 w-fit">
        <button onClick={() => setTab('product')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'product' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          تقييمات المنتجات
          {pendingProduct > 0 && <span className="w-5 h-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center">{pendingProduct}</span>}
        </button>
        <button onClick={() => setTab('blog')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'blog' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          تعليقات المدونة
          {pendingBlog > 0 && <span className="w-5 h-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center">{pendingBlog}</span>}
        </button>
        <button onClick={() => setTab('client')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'client' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          تقييمات العملاء
          {pendingClient > 0 && <span className="w-5 h-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center">{pendingClient}</span>}
        </button>
        <button onClick={() => setTab('surveys')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'surveys' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}>
          الاستطلاعات
          {surveys.length > 0 && <span className="w-5 h-5 bg-primary text-white rounded-full text-[10px] flex items-center justify-center">{surveys.length}</span>}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {s === 'pending' ? 'بانتظار المراجعة' : s === 'approved' ? 'معتمدة' : s === 'rejected' ? 'مرفوضة' : 'الكل'}
          </button>
        ))}
      </div>

      {/* Product Reviews */}
      {tab === 'product' && (
        <div className="space-y-3">
          {filteredProduct.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد تقييمات</p>}
          {filteredProduct.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{r.user_name}</p>
                    <StarDisplay value={r.rating} />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-orange-100 text-orange-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </div>
                  <p className="text-xs text-primary mt-1">المنتج: {getProductName(r.product_id)}</p>
                  {r.title && <p className="font-medium text-sm mt-1">{r.title}</p>}
                  <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status !== 'approved' && <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={() => approveProduct(r.id)}><CheckCircle className="w-4 h-4" /></Button>}
                  {r.status !== 'rejected' && <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-600" onClick={() => rejectProduct(r.id)}><XCircle className="w-4 h-4" /></Button>}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Blog Reviews */}
      {tab === 'blog' && (
        <div className="space-y-3">
          {filteredBlog.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد تعليقات</p>}
          {filteredBlog.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{r.name}</p>
                    <StarDisplay value={r.rating} />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-orange-100 text-orange-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status !== 'approved' && <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={() => approveBlog(r.id)}><CheckCircle className="w-4 h-4" /></Button>}
                  {r.status !== 'rejected' && <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-600" onClick={() => rejectBlog(r.id)}><XCircle className="w-4 h-4" /></Button>}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteBlog(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Client Ratings */}
      {tab === 'client' && (
        <div className="space-y-3">
          {filteredClient.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد تقييمات</p>}
          {filteredClient.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{r.user_name || 'زائر'}</p>
                    <StarDisplay value={r.rating} />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-orange-100 text-orange-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </div>
                  {r.ratings_detail && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(r.ratings_detail).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                          {k === 'design' ? 'التصميم' : k === 'usability' ? 'الاستخدام' : k === 'features' ? 'المميزات' : k === 'performance' ? 'الأداء' : k === 'ai' ? 'الذكاء' : k}: {v}/5
                        </span>
                      ))}
                    </div>
                  )}
                  {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{r.page} — {r.user_email}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status !== 'approved' && <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={async () => { await base44.entities.ClientRating.update(r.id, { status: 'approved' }); toast.success('تم الموافقة'); load(); }}><CheckCircle className="w-4 h-4" /></Button>}
                  {r.status !== 'rejected' && <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-600" onClick={async () => { await base44.entities.ClientRating.update(r.id, { status: 'rejected' }); toast.success('تم الرفض'); load(); }}><XCircle className="w-4 h-4" /></Button>}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={async () => { await base44.entities.ClientRating.delete(r.id); toast.success('تم الحذف'); load(); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Surveys */}
      {tab === 'surveys' && (
        <div className="space-y-3">
          {surveys.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد استطلاعات</p>}
          {surveys.map(s => (
            <div key={s.id} className="bg-card rounded-xl border border-border/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm">{s.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {s.is_active ? 'نشط' : 'متوقف'}
                    </span>
                    {s.is_popup && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">منبثق</span>}
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{s.questions?.length || 0} سؤال</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}