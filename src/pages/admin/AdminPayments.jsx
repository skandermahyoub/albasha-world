import AdminGenericList from './AdminGenericList';

export default function AdminPayments() {
  return <AdminGenericList entityName="PaymentMethod" title="طرق الدفع" fields={[
    { key: 'name', label: 'اسم المحفظة', type: 'text' },
    { key: 'account_number', label: 'رقم الحساب', type: 'text' },
    { key: 'account_name', label: 'اسم صاحب الحساب', type: 'text' },
    { key: 'logo', label: 'شعار المحفظة', type: 'image' },
    { key: 'sort_order', label: 'الترتيب', type: 'number' },
  ]} />;
}