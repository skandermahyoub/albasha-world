import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const phone = String(body?.phone || '').replace(/[^0-9+\-() ]/g, '').trim().slice(0, 40);
    const name = String(body?.name || '').trim().slice(0, 120);
    if (phone.length < 6) return Response.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 });
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ phone }, '-created_date', 1).catch(() => []);
    if (existing.length) {
      if (existing[0].is_active === false || (name && name !== existing[0].name)) {
        await base44.asServiceRole.entities.Subscriber.update(existing[0].id, { is_active: true, ...(name ? { name } : {}) });
      }
      return Response.json({ success: true, existing: true });
    }
    const row = await base44.asServiceRole.entities.Subscriber.create({ phone, name, is_active: true });
    return Response.json({ success: true, id: row.id });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'تعذر الاشتراك' }, { status: 500 });
  }
}
