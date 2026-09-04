import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/lib/useStoreSettings';

const STORAGE_KEY = 'albasha_age_verified';
const DENIED_KEY = 'albasha_age_denied';

export default function AgeGate() {
  const { settings } = useStoreSettings();
  const [verified, setVerified] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [denied, setDenied] = useState(() => sessionStorage.getItem(DENIED_KEY) === '1');

  useEffect(() => {
    if (verified) document.documentElement.style.overflow = '';
    else document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [verified]);

  if (!settings || settings.age_gate_enabled === false || verified) return null;
  const minimumAge = Number(settings.minimum_age) || 18;

  const confirmAge = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    sessionStorage.removeItem(DENIED_KEY);
    setDenied(false);
    setVerified(true);
  };

  const denyAge = () => {
    sessionStorage.setItem(DENIED_KEY, '1');
    setDenied(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background/98 backdrop-blur-xl flex items-center justify-center p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="التحقق من العمر">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${denied ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {denied ? <ShieldX className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>
        <h1 className="font-heading font-bold text-2xl mb-3">التحقق من العمر</h1>
        {denied ? (
          <>
            <p className="text-sm text-muted-foreground leading-7 mb-6">لا يمكن متابعة تصفح هذا المتجر دون تأكيد بلوغ السن المطلوب.</p>
            <Button variant="outline" className="w-full" onClick={() => { sessionStorage.removeItem(DENIED_KEY); setDenied(false); }}>العودة للتحقق</Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground leading-7 mb-2">{settings.age_gate_message || 'يحتوي المتجر على منتجات مخصصة للبالغين. يرجى تأكيد بلوغك السن القانوني قبل المتابعة.'}</p>
            <p className="text-xs text-muted-foreground mb-6">بالضغط على «أنا بالغ» فإنك تؤكد أن عمرك {minimumAge} سنة أو أكثر.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={confirmAge}>أنا بالغ ({minimumAge}+)</Button>
              <Button variant="outline" onClick={denyAge}>عمري أقل من {minimumAge}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
