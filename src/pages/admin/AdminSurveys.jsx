import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BarChart2, X } from 'lucide-react';
import { toast } from 'sonner';

function QuestionEditor({ questions = [], onChange }) {
  const addQ = () => onChange([...questions, { id: Date.now().toString(), text: '', type: 'single', options: ['', ''] }]);
  const removeQ = (i) => onChange(questions.filter((_, idx) => idx !== i));
  const updateQ = (i, patch) => onChange(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const addOption = (i) => updateQ(i, { options: [...(questions[i].options || []), ''] });
  const removeOption = (i, oi) => updateQ(i, { options: questions[i].options.filter((_, idx) => idx !== oi) });
  const updateOption = (i, oi, val) => updateQ(i, { options: questions[i].options.map((o, idx) => idx === oi ? val : o) });

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id || i} className="border border-border rounded-xl p-3 space-y-2">
          <div className="flex gap-2">
            <Input placeholder="نص السؤال" value={q.text} onChange={e => updateQ(i, { text: e.target.value })} className="flex-1" />
            <select className="rounded-lg border border-input bg-background px-2 py-1 text-xs" value={q.type} onChange={e => updateQ(i, { type: e.target.value })}>
              <option value="single">اختيار واحد</option>
              <option value="multiple">اختيار متعدد</option>
              <option value="text">نص حر</option>
            </select>
            <Button variant="ghost" size="icon" onClick={() => removeQ(i)} className="text-destructive shrink-0"><X className="w-4 h-4" /></Button>
          </div>
          {(q.type === 'single' || q.type === 'multiple') && (
            <div className="space-y-1 pr-2">
              {(q.options || []).map((opt, oi) => (
                <div key={oi} className="flex gap-1">
                  <Input placeholder={`خيار ${oi + 1}`} value={opt} onChange={e => updateOption(i, oi, e.target.value)} className="flex-1 h-7 text-xs" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeOption(i, oi)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs h-7 mt-1" onClick={() => addOption(i)}>+ إضافة خيار</Button>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" onClick={addQ} className="w-full text-sm"><Plus className="w-4 h-4 ml-1" /> إضافة سؤال</Button>
    </div>
  );
}

function ResultsDialog({ survey, onClose }) {
  const [responses, setResponses] = useState([]);
  useEffect(() => {
    base44.entities.SurveyResponse.filter({ survey_id: survey.id }, '-created_date', 200).then(setResponses).catch(() => []);
  }, [survey.id]);

  const getStats = (question) => {
    const counts = {};
    responses.forEach(r => {
      const ans = r.answers?.find(a => a.question_id === question.id);
      if (!ans) return;
      const vals = ans.answers?.length ? ans.answers : [ans.answer];
      vals.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return counts;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-2">
        <DialogHeader><DialogTitle>نتائج: {survey.title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{responses.length} مجيب</p>
        <div className="space-y-4">
          {(survey.questions || []).map(q => {
            const stats = getStats(q);
            const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
            return (
              <div key={q.id} className="border border-border rounded-xl p-3">
                <p className="font-bold text-sm mb-2">{q.text}</p>
                {q.type === 'text' ? (
                  <div className="space-y-1">
                    {responses.map((r, i) => {
                      const ans = r.answers?.find(a => a.question_id === q.id);
                      return ans?.answer ? <p key={i} className="text-xs bg-secondary rounded px-2 py-1">"{ans.answer}"</p> : null;
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(stats).map(([opt, count]) => (
                      <div key={opt}>
                        <div className="flex justify-between text-xs mb-0.5"><span>{opt}</span><span>{count} ({Math.round(count / total * 100)}%)</span></div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${count / total * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', questions: [], show_popup: false, popup_delay_seconds: 5, status: 'active' });
  const [resultsFor, setResultsFor] = useState(null);

  const load = () => base44.entities.Survey.list('-created_date', 100).then(setSurveys).catch(() => []);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title) return toast.error('أدخل عنوان الاستطلاع');
    if (editing) await base44.entities.Survey.update(editing.id, form);
    else await base44.entities.Survey.create(form);
    toast.success('تم الحفظ');
    setOpen(false); setEditing(null); setForm({ title: '', description: '', questions: [], show_popup: false, popup_delay_seconds: 5, status: 'active' });
    load();
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', questions: [], show_popup: false, popup_delay_seconds: 5, status: 'active' });
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm(s);
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">الاستطلاعات ({surveys.length})</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" /> استطلاع جديد</Button>
      </div>

      <div className="space-y-2">
        {surveys.map(s => (
          <div key={s.id} className="bg-card rounded-lg p-3 border border-border/50 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground">{(s.questions || []).length} سؤال · {s.status === 'active' ? '🟢 نشط' : '🔴 مغلق'} {s.show_popup ? '· Popup' : ''}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" title="النتائج" onClick={() => setResultsFor(s)}><BarChart2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => { if (confirm('حذف؟')) { await base44.entities.Survey.delete(s.id); load(); } }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {surveys.length === 0 && <p className="text-center text-muted-foreground py-10">لا توجد استطلاعات</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl mx-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'تعديل الاستطلاع' : 'استطلاع جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="العنوان" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="الوصف (اختياري)" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">الحالة</label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">نشط</option>
                  <option value="closed">مغلق</option>
                </select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input type="checkbox" id="popup" checked={!!form.show_popup} onChange={e => setForm(f => ({ ...f, show_popup: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="popup" className="text-sm">عرض كـ Popup</label>
              </div>
            </div>
            {form.show_popup && (
              <div>
                <label className="text-xs text-muted-foreground">تأخير الـ Popup (ثانية)</label>
                <Input type="number" value={form.popup_delay_seconds || 5} onChange={e => setForm(f => ({ ...f, popup_delay_seconds: parseInt(e.target.value) }))} />
              </div>
            )}
            <div>
              <label className="text-sm font-bold mb-2 block">الأسئلة</label>
              <QuestionEditor questions={form.questions || []} onChange={q => setForm(f => ({ ...f, questions: q }))} />
            </div>
            <Button onClick={handleSave} className="w-full">حفظ الاستطلاع</Button>
          </div>
        </DialogContent>
      </Dialog>

      {resultsFor && <ResultsDialog survey={resultsFor} onClose={() => setResultsFor(null)} />}
    </div>
  );
}