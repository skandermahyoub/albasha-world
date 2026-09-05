import { Input } from '@/components/ui/input';
import ShareButton from '@/components/admin/ShareButton';

// URL-only image field: intentionally avoids Base44 paid integrations and external storage credentials.
export default function AIImageField({ value, onChange, context = {}, label = 'الصورة', aspect = 'aspect-video' }) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block">{label}</label>

      {value && (
        <div className="relative mb-2">
          <img src={value} alt="" className={`w-full ${aspect} object-cover rounded-lg`} />
          <div className="absolute top-2 left-2">
            <ShareButton imageUrl={value} title={context?.title} description={context?.subtitle} storeKey={context?.store_key} />
          </div>
        </div>
      )}

      <Input
        placeholder="رابط الصورة"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="mb-2 text-sm"
      />

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        أدخل رابط الصورة مباشرة. لا يستخدم هذا الحقل أي خدمة رفع أو رصيد تكاملات.
      </p>
    </div>
  );
}