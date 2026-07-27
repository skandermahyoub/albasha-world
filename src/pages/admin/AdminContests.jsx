import AdminGenericList from './AdminGenericList';

export default function AdminContests() {
  return <AdminGenericList entityName="Contest" title="المسابقات" imageType="offer" fields={[
    { key: 'title', label: 'العنوان', type: 'text' },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'image', label: 'صورة الإعلان', type: 'image' },
    { key: 'start_date', label: 'تاريخ البداية', type: 'text' },
    { key: 'end_date', label: 'تاريخ النهاية', type: 'text' },
    { key: 'first_prize_points', label: 'نقاط المركز الأول', type: 'number' },
    { key: 'second_prize_points', label: 'نقاط المركز الثاني', type: 'number' },
    { key: 'third_prize_points', label: 'نقاط المركز الثالث', type: 'number' },
    { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'upcoming', label: 'قادمة' }, { value: 'active', label: 'جارية' }, { value: 'ended', label: 'انتهت' }] },
  ]} />;
}