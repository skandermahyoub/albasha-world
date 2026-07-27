import AdminGenericList from './AdminGenericList';

export default function AdminOffers() {
  return <AdminGenericList entityName="SpecialOffer" title="العروض المميزة" imageType="offer" fields={[
    { key: 'title', label: 'العنوان الرئيسي', type: 'text' },
    { key: 'subtitle', label: 'العنوان الفرعي', type: 'text' },
    { key: 'image', label: 'صورة العرض', type: 'image' },
    { key: 'images', label: 'صور إضافية للعرض', type: 'images' },
    { key: 'button_text', label: 'نص زر التنقل', type: 'text' },
    { key: 'button_link', label: 'رابط التنقل المخصص', type: 'text' },
    { key: 'link_type', label: 'نوع الرابط', type: 'select', options: [{ value: 'custom', label: 'مخصص' }, { value: 'product', label: 'منتج' }] },
    { key: 'linked_product_id', label: 'معرف المنتج المرتبط', type: 'text' },
    { key: 'start_date', label: 'تاريخ البداية', type: 'date' },
    { key: 'discount_percent', label: 'نسبة الخصم (%)', type: 'number' },
    { key: 'countdown_end', label: 'تاريخ انتهاء العرض (YYYY-MM-DD)', type: 'text' },
    { key: 'is_flash_sale', label: 'عرض فلاش عاجل (شارة نابضة)', type: 'toggle' },
    { key: 'sort_order', label: 'الترتيب', type: 'number' },
  ]} />;
}