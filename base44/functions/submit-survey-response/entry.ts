import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MAX_TEXT = 1000;

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const surveyId = String(body?.survey_id || '').trim();
    const respondentName = String(body?.respondent_name || '').trim().slice(0, 120);
    if (!surveyId) return Response.json({ error: 'معرف الاستطلاع مطلوب' }, { status: 400 });

    const surveys = await base44.asServiceRole.entities.Survey.filter({ id: surveyId, status: 'active' }, '-created_date', 1).catch(() => []);
    const survey = surveys[0];
    if (!survey) return Response.json({ error: 'الاستطلاع غير متاح' }, { status: 404 });

    const allowed = new Map((survey.questions || []).map((q: any) => [String(q.id), q]));
    const incoming = Array.isArray(body?.answers) ? body.answers : [];
    const answers = incoming.slice(0, 50).map((a: any) => {
      const q = allowed.get(String(a?.question_id || ''));
      if (!q) return null;
      const options = Array.isArray(q.options) ? q.options.map(String) : [];
      let answer = String(a?.answer || '').trim().slice(0, MAX_TEXT);
      let answersList = Array.isArray(a?.answers) ? a.answers.map(String).filter((v: string) => options.includes(v)).slice(0, 30) : [];
      if (q.type === 'single' && options.length && !options.includes(answer)) answer = '';
      if (q.type === 'multiple') answer = answersList.join(', ');
      return { question_id: String(q.id), question_text: String(q.text || '').slice(0, 500), answer, answers: answersList };
    }).filter(Boolean);

    if (!answers.length) return Response.json({ error: 'لا توجد إجابات صالحة' }, { status: 400 });
    const row = await base44.asServiceRole.entities.SurveyResponse.create({ survey_id: survey.id, answers, respondent_name: respondentName });
    return Response.json({ success: true, id: row.id });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'تعذر إرسال الإجابات' }, { status: 500 });
  }
}
