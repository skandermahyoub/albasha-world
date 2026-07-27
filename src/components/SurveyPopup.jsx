import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function SurveyPopup() {
  const [survey, setSurvey] = useState(null);
  const [visible, setVisible] = useState(false);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    base44.entities.Survey.filter({ show_popup: true, status: 'active' }, '-created_date', 1)
      .then(results => {
        const s = results[0];
        if (!s) return;
        const key = `survey_popup_${s.id}`;
        if (sessionStorage.getItem(key)) return;
        setSurvey(s);
        setTimeout(() => setVisible(true), (s.popup_delay_seconds || 5) * 1000);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (survey) sessionStorage.setItem(`survey_popup_${survey.id}`, '1');
    setVisible(false);
  };

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
    await base44.entities.SurveyResponse.create({ survey_id: survey.id, answers: formattedAnswers, respondent_name: name });
    toast.success('شكراً على مشاركتك!');
    setSubmitted(true);
    setTimeout(dismiss, 2000);
  };

  if (!survey) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[85]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[86] top-1/2 -translate-y-1/2 inset-x-4 max-w-md mx-auto bg-card rounded-2xl border border-border shadow-2xl p-5 max-h-[85vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg">{survey.title}</h3>
              <button onClick={dismiss}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-bold">شكراً على مشاركتك!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
                <Input placeholder="اسمك (اختياري)" value={name} onChange={e => setName(e.target.value)} />

                {(survey.questions || []).slice(0, 3).map(q => (
                  <div key={q.id} className="bg-secondary/50 rounded-xl p-3">
                    <p className="font-bold text-sm mb-2">{q.text}</p>
                    {q.type === 'text' && <Input placeholder="إجابتك..." value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value, 'text')} />}
                    {q.type === 'single' && (q.options || []).map(opt => (
                      <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => handleAnswer(q.id, opt, 'single')} className="accent-primary" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                    {q.type === 'multiple' && (q.options || []).map(opt => (
                      <label key={opt} className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <input type="checkbox" checked={(answers[q.id] || []).includes(opt)} onChange={e => handleAnswer(q.id, opt, 'multiple', e.target.checked)} className="accent-primary" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                ))}

                {(survey.questions || []).length > 3 && (
                  <Link to={`/survey/${survey.id}`} onClick={dismiss} className="text-xs text-primary underline block text-center">عرض الاستطلاع كاملاً</Link>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">إرسال</Button>
                  <Button type="button" variant="outline" onClick={dismiss}>لاحقاً</Button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}