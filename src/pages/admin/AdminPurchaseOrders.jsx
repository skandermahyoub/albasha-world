import AdminGenericList from './AdminGenericList';

export default function AdminPurchaseOrders() {
  return (
    <AdminGenericList
      entityName="PurchaseOrder"
      title="أوامر الشراء"
      fields={[
        { key: 'po_number', label: 'رقم أمر الشراء', type: 'text' },
        { key: 'supplier_id', label: 'معرّف المورد', type: 'text' },
        { key: 'supplier_name', label: 'اسم المورد', type: 'text' },
        { key: 'total_cost', label: 'إجمالي التكلفة', type: 'number' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'draft', label: 'مسودة' },
          { value: 'sent', label: 'مُرسل' },
          { value: 'confirmed', label: 'مؤكد' },
          { value: 'received', label: 'مستلم' },
          { value: 'partial', label: 'استلام جزئي' },
          { value: 'cancelled', label: 'ملغي' },
        ] },
        { key: 'auto_generated', label: 'مُنشأ تلقائياً', type: 'toggle' },
        { key: 'sent_via', label: 'أُرسل عبر', type: 'select', options: [
          { value: 'whatsapp', label: 'واتساب' },
          { value: 'email', label: 'بريد إلكتروني' },
          { value: 'manual', label: 'يدوي' },
        ] },
        { key: 'paid_amount', label: 'المبلغ المدفوع', type: 'number' },
        { key: 'remaining_amount', label: 'المبلغ المتبقي', type: 'number' },
        { key: 'expected_delivery', label: 'تاريخ التسليم المتوقع', type: 'date' },
        { key: 'notes', label: 'ملاحظات', type: 'textarea' },
      ]}
    />
  );
}