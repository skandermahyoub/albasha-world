import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, ThumbsUp, CheckCircle, Loader2, Send, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

function StarRating({ value, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const s = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(n)}
        >
          <Star className={`${s} transition-colors ${n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_name: '', title: '', comment: '', rating: 5, image_url: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    base44.functions.invoke('get-public-product-reviews', { product_id: productId })
      .then(res => setReviews(res.data?.reviews || [])).catch(() => setReviews([]));

  useEffect(() => { if (productId) load(); }, [productId]);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingDist = [5,4,3,2,1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0
  }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.user_name || !form.comment) return toast.error('يرجى ملء الاسم والتعليق');
    setLoading(true);
    const res = await base44.functions.invoke('submit-product-review', { ...form, product_id: productId });
    if (!res.data?.success) {
      toast.error(res.data?.error || 'تعذر إرسال التقييم');
      setLoading(false);
      return;
    }
    toast.success(res.data?.verified_purchase ? 'تم إرسال تقييمك كشراء موثق وسيظهر بعد المراجعة' : 'تم إرسال تقييمك وسيظهر بعد المراجعة');
    setForm({ user_name: '', title: '', comment: '', rating: 5, image_url: '' });
    setShowForm(false);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('no file url');
      setForm(f => ({ ...f, image_url: file_url }));
      toast.success('تم رفع الصورة');
    } catch {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const markHelpful = async (review) => {
    try {
      const res = await base44.functions.invoke('mark-product-review-helpful', { review_id: review.id });
      if (!res.data?.success) return toast.error(res.data?.error || 'تعذر تسجيل التصويت');
      if (res.data?.already_voted) toast.info('سبق أن سجّلت هذا التقييم كمفيد');
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, helpful_count: res.data.helpful_count } : r));
    } catch {
      toast.error('سجّل الدخول أولاً لتسجيل التقييم كمفيد');
    }
  };

  return (
    <div className="mt-10 pt-6 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="font-heading font-bold text-xl">التقييمات</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={Math.round(avgRating)} size="sm" />
              <span className="font-bold text-sm">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'إلغاء' : 'أضف تقييمك'}
        </Button>
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className="text-4xl font-heading font-bold text-primary">{avgRating.toFixed(1)}</p>
              <StarRating value={Math.round(avgRating)} size="sm" />
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} تقييم</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDist.map(({ n, count, pct }) => (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-2 text-muted-foreground">{n}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-muted-foreground text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={submit}
            className="bg-card border border-primary/20 rounded-2xl p-4 mb-5 space-y-3 overflow-hidden"
          >
            <h4 className="font-bold text-sm">أضف تقييمك</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">تقييمك:</span>
              <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
            </div>
            <Input placeholder="اسمك *" value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} />
            <Input placeholder="عنوان التقييم (اختياري)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="اكتب تعليقك... *" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} />
            {form.image_url ? (
              <div className="relative w-20 h-20">
                <img src={form.image_url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 cursor-pointer hover:border-primary hover:text-primary transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  {uploading ? 'جاري الرفع...' : 'رفع صورة (اختياري)'}
                </label>
                <Input
                  placeholder="أو رابط صورة (اختياري)"
                  value={form.image_url || ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                />
              </div>
            )}
            <Button type="submit" disabled={loading} className="gap-2 w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال التقييم
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">لا توجد تقييمات بعد، كن أول من يقيّم!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-card rounded-xl p-4 border border-border/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {review.user_name?.[0] || '؟'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm">{review.user_name}</p>
                      {review.verified_purchase && (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-600"><CheckCircle className="w-3 h-3" /> موثق</span>
                      )}
                    </div>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {review.created_date ? new Date(review.created_date).toLocaleDateString('ar-SA') : ''}
                </span>
              </div>
              {review.title && <p className="font-bold text-sm mt-2">{review.title}</p>}
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.comment}</p>
              {review.image_url && (
                <img src={review.image_url} alt="" loading="lazy" className="w-24 h-24 object-cover rounded-lg mt-2" />
              )}
              <button
                onClick={() => markHelpful(review)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                مفيد ({review.helpful_count || 0})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}