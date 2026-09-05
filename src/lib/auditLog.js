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
    await base44.functions.invoke('record-audit-log', {
      action: action || 'other',
      entity_type: entityType || '',
      entity_id: entityId || '',
      entity_name: entityName || '',
      description: description || '',
      old_value: oldValue ? JSON.stringify(oldValue) : '',
      new_value: newValue ? JSON.stringify(newValue) : '',
    });
  } catch (e) {
    // silent fail — audit log should never break the main operation
  }
}