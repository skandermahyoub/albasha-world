import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams } from 'react-router-dom';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import useTheme from '@/lib/useTheme';
import { useCart } from '@/lib/useCart';

export default function SurveyPage() {
  const { id } = useParams();
  const { isDark, toggle } = useTheme();
  const { count: cartCount } = useCart();
  const [settings, setSettings] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.StoreSettings.list().catch(() => []),
      base44.functions.invoke('get-public-survey', { id }).then(res => res.data?.survey || null).catch(() => null),
    ]).then(([s, surv]) => {
      setSettings(s[0] || {});
      setSurvey(surv || null);
      setLoading(false);
    });
  }, [id]);

  const handleAnswer = (qId, value, type, checked) => {
    if (type === 'multiple') {
      setAnswers(prev => {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: checked ? [...cur, value] : cur.filter(v => v !== value) };
      });
    } else {
      setAnswers(prev => ({ ...prev, [qId]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedAnswers = (survey.questions || []).map(q => ({
      question_id: q.id,
      question_text: q.text,
      answer: Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : (answers[q.id] || ''),
      answers: Array.isArray(answers[q.id]) ? answers[q.id] : [],
    }));
    const res = await base44.functions.invoke('submit-survey-response', { survey_id: survey.id, answers: formattedAnswers, respondent_name: name });
    if (!res.data?.success) return toast.error(res.data?.error || 'تعذر إرسال الإجابات');
    setSubmitted(true);
    toast.success('شكراً على مشاركتك!');
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  if (!survey) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">الاستطلاع غير موجود</p></div>;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      <div className="pt-20 px-4 max-w-xl mx-auto pb-20">
        {submitted ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <CheckCircle2 className="w-16 h-16 text-orange-500" />
            <h2 className="font-heading font-bold text-2xl text-center">شكراً على مشاركتك!</h2>
            <p className="text-muted-foreground text-center">تم إرسال إجابتك بنجاح.</p>
          </div>
        ) : (
          <>
            <div className="my-8 text-center">
              {survey.image && <img src={survey.image} alt="" className="w-full max-h-48 object-cover rounded-2xl mb-4" />}
              <h1 className="font-heading font-bold text-2xl">{survey.title}</h1>
              {survey.description && <p className="text-muted-foreground mt-2">{survey.description}</p>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm text-muted-foreground">اسمك (اختياري)</label>
                <Input placeholder="اسمك" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>

              {(survey.questions || []).map(q => (
                <div key={q.id} className="bg-card rounded-xl p-4 border border-border/50">
                  <p className="font-bold text-sm mb-3">{q.text}</p>

                  {q.type === 'text' && (
                    <Input placeholder="إجابتك..." value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value, 'text')} />
                  )}

                  {q.type === 'single' && (q.options || []).map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer py-2 border-b border-border/30 last:border-0">
                      <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => handleAnswer(q.id, opt, 'single')} className="w-4 h-4 accent-primary" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}

                  {q.type === 'multiple' && (q.options || []).map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer py-2 border-b border-border/30 last:border-0">
                      <input type="checkbox" value={opt} checked={(answers[q.id] || []).includes(opt)} onChange={e => handleAnswer(q.id, opt, 'multiple', e.target.checked)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ))}

              <Button type="submit" className="w-full">إرسال الإجابات</Button>
            </form>
          </>
        )}
      </div>
      <Footer settings={settings} />
      <div className="h-20" />
      <BottomNav settings={settings} />
    </div>
  );
}