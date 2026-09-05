import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const orders = await base44.asServiceRole.entities.Order.filter(
      { source: { $ne: 'test' }, status: { $in: ['confirmed', 'preparing', 'shipped', 'delivered'] } },
      '-created_date',
      1
    ).catch(() => []);
    return Response.json({
      success: true,
      has_recent_order: orders.length > 0,
      recent_status: orders[0]?.status || null,
    });
  } catch (error) {
    return Response.json({ success: true, has_recent_order: false, recent_status: null });
  }
}
