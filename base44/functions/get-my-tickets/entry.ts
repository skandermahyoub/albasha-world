import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const rows = await base44.asServiceRole.entities.Ticket.filter({ customer_email: user.email }, '-created_date', 100);
    const tickets = rows.map(t => ({
      id: t.id, ticket_number: t.ticket_number, subject: t.subject, description: t.description,
      category: t.category, priority: t.priority, status: t.status, order_id: t.order_id || '',
      messages: t.messages || [], resolution: t.resolution || '', resolved_at: t.resolved_at || '', created_date: t.created_date,
    }));
    return Response.json({ success: true, tickets });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل التذاكر' }, { status: 500 });
  }
}
