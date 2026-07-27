import AdminGenericList from './AdminGenericList';

export default function AdminAffiliates() {
  return (
    <AdminGenericList
      entityName="Affiliate"
      title="نظام التسويق بالعمولة"
      fields={[
        { key: 'customer_name', label: 'اسم المسوق', type: 'text' },
        { key: 'customer_email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'affiliate_code', label: 'كود المسوق', type: 'text' },
        { key: 'commission_rate', label: 'نسبة العمولة %', type: 'number' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'pending', label: 'قيد المراجعة' },
          { value: 'active', label: 'مفعّل' },
          { value: 'suspended', label: 'موقوف' },
        ] },
        { key: 'total_clicks', label: 'إجمالي النقرات', type: 'number' },
        { key: 'total_sales', label: 'إجمالي المبيعات', type: 'number' },
        { key: 'total_commission', label: 'العمولة المستحقة', type: 'number' },
        { key: 'paid_commission', label: 'العمولة المدفوعة', type: 'number' },
        { key: 'referral_link', label: 'رابط الإحالة', type: 'text' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ]}
    />
  );
}