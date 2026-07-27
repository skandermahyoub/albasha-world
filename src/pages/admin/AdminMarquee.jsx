import AdminGenericList from './AdminGenericList';

export default function AdminMarquee() {
  return <AdminGenericList entityName="MarqueeText" title="الشريط النصي المتحرك" fields={[
    { key: 'text', label: 'النص', type: 'text' },
    { key: 'sort_order', label: 'الترتيب', type: 'number' },
  ]} />;
}