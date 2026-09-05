import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireStaffPermission } from '../../shared/staffAuthorization.ts';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'تسجيل الدخول مطلوب' }, { status: 401 });
    const access = await requireStaffPermission(base44, user, 'accounting', 'add');
    if (!access) return Response.json({ error: 'صلاحية غير كافية' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = body?.type === 'withdrawal' ? 'withdrawal' : body?.type === 'deposit' ? 'deposit' : null;
    const amount = Number(body?.amount) || 0;
    const reason = String(body?.reason || '').trim().slice(0, 500);
    if (!type || amount <= 0 || amount > 1000000000) return Response.json({ error: 'بيانات العملية غير صحيحة' }, { status: 400 });

    const transactions = await base44.asServiceRole.entities.SystemTransaction.filter({ is_test: { $ne: true } }, '-created_date', 5000).catch(() => []);
    const balance = transactions.reduce((sum: number, t: any) => {
      const value = Number(t.amount) || 0;
      if (t.type === 'withdrawal') return sum - value;
      return sum + value;
    }, 0);
    if (type === 'withdrawal' && amount > balance) return Response.json({ error: 'الرصيد غير كافٍ' }, { status: 409 });

    const record = await base44.asServiceRole.entities.SystemTransaction.create({
      type,
      amount,
      performed_by: user.full_name || user.email || 'الإدارة',
      reason,
      date: new Date().toISOString(),
      is_sample: false,
    });
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'create',
      entity_type: 'SystemTransaction',
      entity_id: record.id,
      entity_name: type,
      performed_by: user.full_name || user.email || 'الإدارة',
      performed_by_email: user.email || '',
      description: `${type === 'deposit' ? 'إيداع' : 'سحب'} يدوي بقيمة ${amount}${reason ? ` — ${reason}` : ''}`,
    }).catch(() => {});
    return Response.json({ success: true, transaction: record, balance_after: type === 'withdrawal' ? balance - amount : balance + amount });
  } catch (error) {
    return Response.json({ error: error?.message || 'تعذر تسجيل العملية' }, { status: 500 });
  }
}
