import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CATEGORIES = ['order_issue','product_issue','payment_issue','shipping_issue','account_issue','general','complaint'];
const PRIORITIES = ['low','medium','high','urgent'];
const clean = (v, n=1200) => String(v || '').trim().slice(0, n);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const body = await req.json();
    const subject = clean(body.subject, 180);
    const description = clean(body.description, 2000);
    const category = CATEGORIES.includes(body.category) ? body.category : 'general';
    const priority = PRIORITIES.includes(body.priority) ? body.priority : 'medium';
    const orderId = clean(body.order_id, 120);
    if (!subject || !description) return Response.json({ error: 'الموضوع والتفاصيل مطلوبان' }, { status: 400 });

    if (orderId) {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId, customer_email: user.email }, '-created_date', 1);
      if (!orders.length) return Response.json({ error: 'الطلب المرتبط لا يخص حسابك' }, { status: 403 });
    }

    const profiles = await base44.asServiceRole.entities.CustomerProfile.filter({ user_email: user.email, is_archived: false }, '-created_date', 1).catch(() => []);
    const profile = profiles[0];
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const ticket = await base44.asServiceRole.entities.Ticket.create({
      ticket_number: ticketNumber,
      subject,
      description,
      customer_name: profile?.full_name || profile?.name || user.full_name || '',
      customer_email: user.email,
      customer_phone: profile?.phone || '',
      category,
      priority,
      status: 'open',
      assigned_to: '',
      order_id: orderId,
      messages: [{ sender: profile?.full_name || user.full_name || 'العميل', sender_role: 'customer', message: description, timestamp: new Date().toISOString() }],
    });
    return Response.json({ success: true, ticket: { id: ticket.id, ticket_number: ticketNumber, status: 'open' } });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر إنشاء التذكرة' }, { status: 500 });
  }
}
