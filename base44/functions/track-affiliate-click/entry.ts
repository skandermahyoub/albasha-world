import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function getVisitorKey(req) {
  const ip = req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  return `${ip}::${ua.slice(0, 50)}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { affiliate_code } = body;

    if (!affiliate_code) {
      return Response.json({ error: 'كود المسوق مطلوب' }, { status: 400 });
    }

    const visitorKey = getVisitorKey(req);
    const now = Date.now();
    const dedupWindowMs = 30 * 60 * 1000; // 30 minutes dedup window

    // Validate affiliate exists and is active
    const affs = await base44.asServiceRole.entities.Affiliate.filter({
      affiliate_code, status: 'active'
    });
    const aff = affs[0];
    if (!aff) {
      return Response.json({ success: false, message: 'كود مسوق غير صالح' });
    }

    // Check for recent click from same visitor (dedup)
    // We use total_clicks as a heuristic — but better: check recent clicks via a log entity.
    // Since we don't have a separate click entity, we use a time-based dedup:
    // Only increment if the visitor hasn't clicked in the last 30 minutes.
    // We store the last click visitor_key+timestamp in the notes field as a simple dedup.
    // Actually, a better approach: check if the same visitor clicked recently.

    // For now, use a simple approach: increment clicks but with dedup via a timestamp check
    // We'll store the last_click_info in a simple format.
    const lastClickInfo = aff.notes || '';
    const lastClickParts = lastClickInfo.split('|');
    if (lastClickParts.length >= 3 && lastClickParts[0] === visitorKey) {
      const lastClickTime = parseInt(lastClickParts[1] || '0');
      if (now - lastClickTime < dedupWindowMs) {
        // Same visitor within dedup window — don't count
        return Response.json({
          success: true,
          message: 'تم تسجيل النقرة مسبقاً',
          total_clicks: aff.total_clicks || 0,
          dedup: true,
        });
      }
    }

    // Increment click count
    await base44.asServiceRole.entities.Affiliate.update(aff.id, {
      total_clicks: (aff.total_clicks || 0) + 1,
      notes: `${visitorKey}|${now}|${affiliate_code}`,
    });

    return Response.json({
      success: true,
      message: 'تم تسجيل النقرة',
      total_clicks: (aff.total_clicks || 0) + 1,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}