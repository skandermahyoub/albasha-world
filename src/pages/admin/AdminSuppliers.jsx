import AdminGenericList from './AdminGenericList';

export default function AdminSuppliers() {
  return (
    <AdminGenericList
      entityName="Supplier"
      title="إدارة الموردين"
      fields={[
        { key: 'name', label: 'اسم المورد', type: 'text' },
        { key: 'company', label: 'اسم الشركة', type: 'text' },
        { key: 'contact_person', label: 'مسؤول التواصل', type: 'text' },
        { key: 'phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'whatsapp', label: 'رقم الواتساب', type: 'text' },
        { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'address', label: 'العنوان', type: 'textarea' },
        { key: 'category', label: 'فئة المورد', type: 'text' },
        { key: 'total_purchases', label: 'إجمالي المشتريات', type: 'number' },
        { key: 'total_paid', label: 'إجمالي المدفوع', type: 'number' },
        { key: 'outstanding_debt', label: 'المبلغ المستحق للمورد', type: 'number' },
        { key: 'payment_terms', label: 'شروط الدفع', type: 'text' },
        { key: 'is_active', label: 'مفعّل', type: 'toggle' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ]}
    />
  );
}