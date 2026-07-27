import AdminGenericList from './AdminGenericList';

export default function AdminReturns() {
  return (
    <AdminGenericList
      entityName="ReturnRequest"
      title="إدارة المرتجعات (RMA)"
      fields={[
        { key: 'request_number', label: 'رقم الطلب', type: 'text' },
        { key: 'customer_name', label: 'اسم العميل', type: 'text' },
        { key: 'customer_email', label: 'بريد العميل', type: 'text' },
        { key: 'customer_phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'order_id', label: 'معرّف الطلب الأصلي', type: 'text' },
        { key: 'product_title', label: 'اسم المنتج', type: 'text' },
        { key: 'reason', label: 'سبب الإرجاع', type: 'select', options: [
          { value: 'defective', label: 'منتج معيب' },
          { value: 'wrong_item', label: 'منتج خاطئ' },
          { value: 'not_as_described', label: 'غير مطابق للوصف' },
          { value: 'changed_mind', label: 'تغيير الرأي' },
          { value: 'damaged_shipping', label: 'تضرر أثناء الشحن' },
          { value: 'other', label: 'أخرى' },
        ] },
        { key: 'type', label: 'نوع الطلب', type: 'select', options: [
          { value: 'return', label: 'استرجاع' },
          { value: 'exchange', label: 'استبدال' },
        ] },
        { key: 'description', label: 'تفاصيل الإرجاع', type: 'textarea' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'pending', label: 'قيد المراجعة' },
          { value: 'approved', label: 'موافق عليه' },
          { value: 'rejected', label: 'مرفوض' },
          { value: 'pickup_scheduled', label: 'مجدول للاستلام' },
          { value: 'received', label: 'تم الاستلام' },
          { value: 'refunded', label: 'تم الاسترداد' },
          { value: 'completed', label: 'مكتمل' },
        ] },
        { key: 'refund_amount', label: 'مبلغ الاسترداد', type: 'number' },
        { key: 'refund_method', label: 'طريقة الاسترداد', type: 'select', options: [
          { value: 'wallet', label: 'المحفظة الرقمية' },
          { value: 'bank_transfer', label: 'تحويل بنكي' },
          { value: 'cash', label: 'نقدي' },
          { value: 'store_credit', label: 'رصيد المتجر' },
        ] },
        { key: 'admin_notes', label: 'ملاحظات الإدارة', type: 'textarea' },
      ]}
    />
  );
}