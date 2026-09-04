import { useState, useRef } from 'react';
import { Star, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            className={`w-5 h-5 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="w-48 h-48 md:w-56 md:h-56 snap-center flex-shrink-0 bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex flex-col justify-between">
      <StarRating value={review.rating} readonly />
      <p className="text-xs mt-2 text-foreground leading-relaxed flex-1 overflow-hidden line-clamp-4">{review.comment}</p>
      <p className="text-xs text-muted-foreground font-bold mt-2 truncate">{review.name}</p>
    </div>
  );
}

export default function ReviewsSection({ reviews = [] }) {
  const scrollRef = useRef(null);
  const [form, setForm] = useState({ name: '', phone: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const approvedReviews = reviews.filter(r => r.status === 'approved');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.comment) return toast.error('يرجى ملء جميع الحقول');
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('submit-review', { name: form.name, rating: form.rating, comment: form.comment, context: 'store' });
      if (!res.data?.success) {
        toast.error(res.data?.error || 'تعذر إرسال رأيك');
        setSubmitting(false);
        return;
      }
      toast.success('شكراً! تم إرسال رأيك وسيتم مراجعته');
      setForm({ name: '', phone: '', rating: 5, comment: '' });
    } catch {
      toast.error('تعذر إرسال رأيك');
    }
    setSubmitting(false);
  };

  return (
    <section className="my-10 px-4">
      <h2 className="font-heading font-bold text-2xl text-center mb-6">آراء عملائنا</h2>

      {approvedReviews.length > 0 && (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 mb-8" style={{ scrollbarWidth: 'none' }}>
          {approvedReviews.map((review, i) => (
            <ReviewCard key={review.id || i} review={review} />
          ))}
        </div>
      )}

      {/* Review Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-md mx-auto bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
      >
        <h3 className="font-heading font-bold text-lg mb-4 text-center">شاركنا رأيك</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="الاسم" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="رقم الهاتف (اختياري)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">التقييم:</span>
            <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <Textarea placeholder="اكتب رأيك هنا..." value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} rows={3} />
          <Button type="submit" className="w-full" disabled={submitting}>
            <Send className="w-4 h-4 ml-2" />
            {submitting ? 'جاري الإرسال...' : 'إرسال الرأي'}
          </Button>
        </form>
      </motion.div>
    </section>
  );
}