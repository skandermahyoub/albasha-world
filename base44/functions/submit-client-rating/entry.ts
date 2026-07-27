import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MAX_COMMENT_LENGTH = 1000;
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MS = 3600 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { rating, comment, ratings_detail, page, context } = body;

    // Validate rating
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return Response.json({ error: 'التقييم يجب أن يكون بين 1 و 5' }, { status: 400 });
    }

    // Validate comment
    const c = (comment || '').slice(0, MAX_COMMENT_LENGTH);

    // Get user (may be null for guest)
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    const userEmail = user?.email || '';
    const userName = user?.full_name || 'زائر';

    // Rate limit by email or visitor fingerprint
    const filterKey = userEmail || (req.headers.get('x-forwarded-for') || 'unknown') + '|' + (req.headers.get('user-agent') || '');
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const recentRatings = await base44.asServiceRole.entities.ClientRating.list('-created_date', 100);
    const recentCount = recentRatings.filter(r =>
      (r.user_email || '') === userEmail &&
      userEmail !== '' &&
      (r.created_date || '') >= oneHourAgo
    ).length;

    if (recentCount >= RATE_LIMIT_COUNT) {
      return Response.json({ error: 'لقد بلغت الحد المسموح من التقييمات في هذه الساعة' }, { status: 429 });
    }

    // Validate ratings_detail
    let detail = {};
    if (ratings_detail && typeof ratings_detail === 'object') {
      for (const [k, v] of Object.entries(ratings_detail)) {
        const num = Number(v);
        if (Number.isInteger(num) && num >= 1 && num <= 5) {
          detail[k] = num;
        }
      }
    }

    const created = await base44.asServiceRole.entities.ClientRating.create({
      rating: r,
      comment: c,
      user_email: userEmail,
      user_name: userName,
      page: page || (req.headers.get('referer') || ''),
      context: context || 'home',
      ratings_detail: detail,
      status: 'pending',
    });

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}