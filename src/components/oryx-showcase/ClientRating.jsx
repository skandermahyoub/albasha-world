import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, Award, ThumbsUp, MessageSquare, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const RATING_ITEMS = [
  { key: 'design', label: 'جودة التصميم والواجهة', icon: Star },
  { key: 'usability', label: 'سهولة الاستخدام', icon: ThumbsUp },
  { key: 'features', label: 'اكتمال المميزات', icon: CheckCircle },
  { key: 'performance', label: 'الأداء والسرعة', icon: Award },
  { key: 'ai', label: 'الذكاء الاصطناعي', icon: MessageSquare },
];

const MAX_COMMENT_LENGTH = 1000;
const SUBMIT_COOLDOWN_MS = 5000;

export default function ClientRating() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState(RATING_ITEMS.map(() => 0));
  const [hover, setHover] = useState(RATING_ITEMS.map(() => 0));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const avg = ratings.filter(r => r > 0).length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.filter(r => r > 0).length).toFixed(1)
    : '٠';

  const handleSubmit = async () => {
    if (submitting) return;
    if (ratings.every(r => r === 0)) return;

    setSubmitting(true);

    try {
      // Rate limit: prevent rapid re-submission
      const lastSubmit = parseInt(localStorage.getItem('basha_rating_last') || '0', 10);
      if (Date.now() - lastSubmit < SUBMIT_COOLDOWN_MS) {
        toast.error('يرجى الانتظار قليلاً قبل إرسال تقييم آخر');
        setSubmitting(false);
        return;
      }

      const ratingsDetail = {};
      RATING_ITEMS.forEach((item, i) => {
        if (ratings[i] > 0) ratingsDetail[item.key] = ratings[i];
      });

      const avgRating = ratings.filter(r => r > 0).length
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.filter(r => r > 0).length)
        : 5;

      await base44.entities.ClientRating.create({
        rating: avgRating,
        comment: feedback.slice(0, MAX_COMMENT_LENGTH),
        user_email: user?.email || '',
        user_name: user?.full_name || 'زائر',
        page: window.location.pathname,
        context: 'home',
        ratings_detail: ratingsDetail,
        status: 'pending',
      });

      localStorage.setItem('basha_rating_last', String(Date.now()));
      setSubmitted(true);
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (e) {
      toast.error('فشل حفظ التقييم. يرجى المحاولة مرة أخرى.');
    }
    setSubmitting(false);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/40">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-xs font-bold text-primary tracking-wider">تقييم العميل</span>
          <h2 className="font-heading font-black text-3xl md:text-5xl mt-2 mb-3">ما رأيك في عالم الباشا؟</h2>
          <p className="text-muted-foreground">قيّم تجربتك مع المتجر — رأيك يُحفّزنا للتطور</p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-heading font-bold text-2xl mb-2">شكراً لتقييمك!</h3>
            <p className="text-muted-foreground mb-4">تقييمك المتوسط: <span className="font-bold text-primary text-lg">{avg} من ٥</span></p>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-8 h-8 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">تم حفظ تقييمك بنجاح، شكراً لمساهمتك في تطوير عالم الباشا</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="text-5xl font-heading font-black text-primary">{avg}</div>
              <div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">المعدل الحالي</p>
              </div>
            </div>

            <div className="space-y-5 mb-6">
              {RATING_ITEMS.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-body font-medium">{item.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRatings(prev => { const n = [...prev]; n[i] = star; return n; })}
                        onMouseEnter={() => setHover(prev => { const n = [...prev]; n[i] = star; return n; })}
                        onMouseLeave={() => setHover(prev => { const n = [...prev]; n[i] = 0; return n; })}
                        className="transition-transform hover:scale-125"
                      >
                        <Star className={`w-6 h-6 transition-colors ${(hover[i] || ratings[i]) >= star ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              placeholder="أضف ملاحظاتك أو اقتراحاتك..."
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm font-body min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
            />
            <p className="text-[10px] text-muted-foreground text-left mb-5">{feedback.length}/{MAX_COMMENT_LENGTH}</p>

            <button
              onClick={handleSubmit}
              disabled={ratings.every(r => r === 0) || submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'جاري الحفظ...' : 'إرسال التقييم'}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}