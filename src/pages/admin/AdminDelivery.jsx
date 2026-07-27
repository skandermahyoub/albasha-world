import AdminGenericList from './AdminGenericList';

export default function AdminDelivery() {
  return (
    <AdminGenericList
      entityName="DeliveryAgent"
      title="إدارة المندوبين والتوصيل"
      fields={[
        { key: 'name', label: 'اسم المندوب', type: 'text' },
        { key: 'phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'vehicle_type', label: 'نوع المركبة', type: 'select', options: [
          { value: 'motorcycle', label: 'دراجة نارية' },
          { value: 'car', label: 'سيارة' },
          { value: 'bicycle', label: 'دراجة هوائية' },
          { value: 'van', label: 'شاحنة صغيرة' },
        ] },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'available', label: 'متاح' },
          { value: 'busy', label: 'مشغول' },
          { value: 'offline', label: 'غير متصل' },
        ] },
        { key: 'completed_deliveries', label: 'التوصيلات المكتملة', type: 'number' },
        { key: 'rating', label: 'التقييم', type: 'number' },
        { key: 'is_active', label: 'مفعّل', type: 'toggle' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ]}
    />
  );
}