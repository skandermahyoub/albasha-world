import AdminGenericList from './AdminGenericList';

export default function AdminAbandonedCarts() {
  return (
    <AdminGenericList
      entityName="AbandonedCart"
      title="السلات المتروكة"
      fields={[
        { key: 'customer_name', label: 'اسم العميل', type: 'text' },
        { key: 'customer_email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'customer_phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'cart_total', label: 'إجمالي السلة', type: 'number' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'pending', label: 'بانتظار التذكير' },
          { value: 'reminded', label: 'تم التذكير' },
          { value: 'recovered', label: 'تم الاسترجاع' },
          { value: 'expired', label: 'منتهي الصلاحية' },
        ] },
        { key: 'reminder_sent', label: 'تم إرسال التذكير', type: 'toggle' },
        { key: 'reminder_method', label: 'طريقة التذكير', type: 'select', options: [
          { value: 'none', label: 'لا يوجد' },
          { value: 'whatsapp', label: 'واتساب' },
          { value: 'email', label: 'بريد إلكتروني' },
          { value: 'push', label: 'إشعار' },
        ] },
        { key: 'discount_code', label: 'كود خصم التحفيز', type: 'text' },
        { key: 'recovered_order_id', label: 'معرّف الطلب المسترجع', type: 'text' },
      ]}
    />
  );
}