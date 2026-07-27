import { base44 } from '@/api/base44Client';

/**
 * يفحص قائمة المنتجات ويعيد ضبط أي خصم انتهت مدته:
 * - ينسخ old_price إلى price
 * - يفرغ old_price و discount_end_date
 * يعيد نفس القائمة مع الأسعار المُحدّثة.
 */
export async function revertExpiredDiscounts(products) {
  if (!products?.length) return products;
  const now = new Date();
  const expired = products.filter(
    p => p.discount_end_date && p.old_price && new Date(p.discount_end_date) < now
  );
  if (!expired.length) return products;

  const updates = expired.map(p => ({
    id: p.id,
    price: p.old_price,
    old_price: null,
    discount_end_date: null,
  }));

  try {
    await base44.entities.Product.bulkUpdate(updates);
  } catch (e) {
    // إذا فشل التحديث نستمر بالأسعار الحالية
  }

  // نحدّث القائمة المحلية بنفس التغييرات
  const idMap = new Map(updates.map(u => [u.id, u]));
  return products.map(p => {
    const upd = idMap.get(p.id);
    return upd ? { ...p, ...upd } : p;
  });
}