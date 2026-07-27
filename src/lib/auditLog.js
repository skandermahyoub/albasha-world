import { base44 } from '@/api/base44Client';

/**
 * تسجيل إجراء في سجل النشاط (Audit Log)
 * @param {Object} params
 * @param {string} params.action - نوع الإجراء (create, update, delete, price_change, settings_change, login, etc.)
 * @param {string} params.entityType - نوع الكيان المتأثر (Product, Order, etc.)
 * @param {string} params.entityId - معرّف الكيان
 * @param {string} params.entityName - اسم/عنوان الكيان للعرض
 * @param {string} params.description - وصف الإجراء
 * @param {*} params.oldValue - القيمة القديمة (سيتم تحويلها لـ JSON)
 * @param {*} params.newValue - القيمة الجديدة (سيتم تحويلها لـ JSON)
 */
export async function logAction({ action, entityType, entityId, entityName, description, oldValue, newValue }) {
  try {
    let me = null;
    try { me = await base44.auth.me(); } catch {}
    await base44.entities.AuditLog.create({
      action: action || 'other',
      entity_type: entityType || '',
      entity_id: entityId || '',
      entity_name: entityName || '',
      performed_by: me?.full_name || me?.email || 'النظام',
      performed_by_email: me?.email || '',
      description: description || '',
      old_value: oldValue ? JSON.stringify(oldValue) : '',
      new_value: newValue ? JSON.stringify(newValue) : '',
    });
  } catch (e) {
    // silent fail — audit log should never break the main operation
  }
}