import AdminGenericList from './AdminGenericList';

export default function AdminWallets() {
  return (
    <AdminGenericList
      entityName="WalletTransaction"
      title="المحفظة الرقمية والمعاملات"
      readOnly={true}
      fields={[
        { key: 'customer_email', label: 'بريد العميل', type: 'text' },
        { key: 'type', label: 'نوع المعاملة', type: 'select', options: [
          { value: 'deposit', label: 'إيداع' },
          { value: 'withdrawal', label: 'سحب' },
          { value: 'refund', label: 'استرداد' },
          { value: 'gift', label: 'هدية' },
          { value: 'purchase', label: 'شراء' },
          { value: 'cashback', label: 'استرداد نقدي' },
        ] },
        { key: 'amount', label: 'المبلغ', type: 'number' },
        { key: 'balance_after', label: 'الرصيد بعد العملية', type: 'number' },
        { key: 'description', label: 'الوصف', type: 'textarea' },
        { key: 'order_id', label: 'معرّف الطلب المرتبط', type: 'text' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'pending', label: 'قيد المعالجة' },
          { value: 'completed', label: 'مكتملة' },
          { value: 'failed', label: 'فشلت' },
        ] },
      ]}
    />
  );
}