import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Instagram, Download, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareButton({ imageUrl, title, description, storeName }) {
  const [open, setOpen] = useState(false);

  const caption = `${title || ''}\n\n${description || ''}\n\n${storeName ? `🛍️ ${storeName}` : '🛍️ عالم الباشا للتسوق'}\n#عالم_الباشا #تسوق`;

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'عالم الباشا للتسوق', text: caption, url: imageUrl });
      } catch {}
    } else {
      copyCaption();
      toast.info('انسخ الوصف ثم افتح إنستقرام للنشر');
    }
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${(title || 'image').replace(/\s+/g, '_')}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast.success('تم نسخ الوصف الاحترافي');
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="gap-1 shadow-lg">
        <Share2 className="w-3.5 h-3.5" /> مشاركة
      </Button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">مشاركة على وسائل التواصل</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {imageUrl && <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-lg" />}
            <div className="bg-secondary/30 rounded-lg p-2 text-xs text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap">{caption}</div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={shareFacebook} className="gap-1"><Facebook className="w-4 h-4" /> فيسبوك</Button>
              <Button onClick={shareNative} className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500"><Instagram className="w-4 h-4" /> إنستقرام</Button>
              <Button variant="outline" onClick={downloadImage} className="gap-1"><Download className="w-4 h-4" /> تحميل الصورة</Button>
              <Button variant="outline" onClick={copyCaption} className="gap-1"><Copy className="w-4 h-4" /> نسخ الوصف</Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">للنشر على إنستقرام: حمّل الصورة، انسخ الوصف، ثم الصقه في إنستقرام</p>
          </div>
        </div>
      )}
    </>
  );
}