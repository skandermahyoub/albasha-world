import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    const popup = body?.popup === true;
    let rows: any[] = [];
    if (id) rows = await base44.asServiceRole.entities.Survey.filter({ id, status: 'active' }, '-created_date', 1).catch(() => []);
    else if (popup) rows = await base44.asServiceRole.entities.Survey.filter({ show_popup: true, status: 'active' }, '-created_date', 1).catch(() => []);
    const survey = rows[0];
    if (!survey) return Response.json({ success: true, survey: null });
    return Response.json({ success: true, survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description || '',
      image: survey.image || '',
      questions: survey.questions || [],
      show_popup: survey.show_popup === true,
      popup_delay_seconds: Math.max(0, Number(survey.popup_delay_seconds) || 5),
      status: 'active',
    }});
  } catch (error: any) {
    return Response.json({ error: error?.message || 'تعذر تحميل الاستطلاع' }, { status: 500 });
  }
}
