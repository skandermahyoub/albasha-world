import AdminGenericList from '@/pages/admin/AdminGenericList';

export default function AdminHomeHighlights() {
  return <AdminGenericList entityName="HomeHighlight" title="مميزات الرئيسية" fields={[
    { key: 'title', label: 'العنوان' },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'icon', label: 'الأيقونة', type: 'select', options: [
      { value: 'shield', label: 'ضمان' }, { value: 'truck', label: 'توصيل' },
      { value: 'rotate', label: 'استرجاع' }, { value: 'headphones', label: 'دعم' }
    ]},
    { key: 'sort_order', label: 'الترتيب', type: 'number' },
    { key: 'is_active', label: 'مفعل', type: 'toggle' }
  ]} />;
}