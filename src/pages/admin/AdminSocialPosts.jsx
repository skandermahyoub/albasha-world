import AdminGenericList from './AdminGenericList';

export default function AdminSocialPosts() {
  return <AdminGenericList entityName="SocialPost" title="منشورات السوشيال ميديا" imageType="banner" fields={[
    { key: 'title', label: 'العنوان', type: 'text' },
    { key: 'content', label: 'نص المنشور', type: 'textarea' },
    { key: 'image', label: 'الصورة', type: 'image' },
    { key: 'link', label: 'رابط المنشور الأصلي', type: 'text' },
    { key: 'platform', label: 'المنصة', type: 'select', options: [{ value: 'facebook', label: 'فيسبوك' }, { value: 'instagram', label: 'إنستغرام' }] },
    { key: 'likes_count', label: 'عدد الإعجابات', type: 'number' },
    { key: 'comments_count', label: 'عدد التعليقات', type: 'number' },
    { key: 'sort_order', label: 'الترتيب', type: 'number' },
  ]} />;
}