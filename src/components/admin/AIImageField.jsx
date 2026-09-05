import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import ShareButton from '@/components/admin/ShareButton';

export default function AIImageField({ value, onChange, context = {}, label = 'الصورة', aspect = 'aspect-video' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('الملف المختار ليس صورة');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً (الحد 5 ميجابايت)');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('لم يرجع رابط للصورة');
      onChange(file_url);
      toast.success('تم رفع الصورة');
    } catch (err) {
      toast.error('فشل رفع الصورة');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
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

      <div className="flex gap-2 mb-2">
        <label className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <Upload className="w-4 h-4" /> {uploading ? 'جاري الرفع...' : 'رفع صورة'}
        </label>
        <Input
          placeholder="أو رابط الصورة"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="flex-1 text-sm"
        />
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        يمكنك رفع الصورة من الجهاز أو إدخال رابط مباشر لها.
      </p>
    </div>
  );
}