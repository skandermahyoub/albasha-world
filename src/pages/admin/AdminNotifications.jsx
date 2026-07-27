import AdminGenericList from './AdminGenericList';

export default function AdminNotifications() {
  return (
    <AdminGenericList
      entityName="Notification"
      title="نظام الإشعارات الذكي"
      fields={[
        { key: 'title', label: 'عنوان الإشعار', type: 'text' },
        { key: 'message', label: 'نص الرسالة', type: 'textarea' },
        { key: 'icon', label: 'الأيقونة (إيموجي)', type: 'text' },
        { key: 'type', label: 'النوع', type: 'select', options: [
          { value: 'promo', label: '🎁 عرض' },
          { value: 'info', label: 'ℹ️ معلومة' },
          { value: 'alert', label: '🔔 تنبيه' },
          { value: 'loyalty', label: '⭐ ولاء' },
        ]},
        { key: 'customer_email', label: 'بريد عميل محدد (فارغ = للجميع)', type: 'text' },
        { key: 'interval_minutes', label: 'يظهر كل (دقيقة)', type: 'number' },
        { key: 'sort_order', label: 'الترتيب في الدوران', type: 'number' },
      ]}
    />
  );
}