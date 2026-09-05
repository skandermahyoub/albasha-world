import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const name = String(body?.name || '').trim().slice(0, 120);
    const phone = String(body?.phone || '').replace(/[^0-9+\-() ]/g, '').trim().slice(0, 40);
    const message = String(body?.message || '').trim().slice(0, 2000);
    if (name.length < 2 || phone.length < 6 || message.length < 3) {
      return Response.json({ error: 'يرجى إدخال بيانات تواصل صحيحة' }, { status: 400 });
    }
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const recent = await base44.asServiceRole.entities.ContactMessage.list('-created_date', 100).catch(() => []);
    const samePhone = recent.filter((r: any) => r.phone === phone && (r.created_date || '') >= since).length;
    if (samePhone >= MAX_PER_WINDOW) return Response.json({ error: 'تم استلام عدة رسائل مؤخراً. حاول لاحقاً.' }, { status: 429 });
    const row = await base44.asServiceRole.entities.ContactMessage.create({ name, phone, message, is_read: false });
    return Response.json({ success: true, id: row.id });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'تعذر إرسال الرسالة' }, { status: 500 });
  }
}
