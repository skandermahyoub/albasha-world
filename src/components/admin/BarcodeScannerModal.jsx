import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';

const SCANNER_ID = 'barcode-scanner-region';

export default function BarcodeScannerModal({ open, onClose, onScan, continuous = false }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const lastScanRef = useRef('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setManualCode('');
    setStarting(true);
    let cancelled = false;
    let startTimer;

    const config = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const width = Math.min(Math.floor(viewfinderWidth * 0.85), 320);
        const height = Math.min(Math.floor(viewfinderHeight * 0.45), 180);
        return { width, height };
      },
      aspectRatio: 1.777,
    };

    const onDecoded = (decodedText) => {
      if (!cancelled && decodedText) {
        // في وضع المسح المستمر نتجنب تكرار نفس الباركود خلال ثانية
        if (continuous) {
          if (decodedText === lastScanRef.current) return;
          lastScanRef.current = decodedText;
          setTimeout(() => { lastScanRef.current = ''; }, 1500);
        }
        onScan(decodedText);
        if (!continuous) { cancelled = true; }
      }
    };

    const describeError = (err) => {
      const msg = String(err?.message || err || '').toLowerCase();
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        return 'المسح بالكاميرا يتطلب فتح التطبيق من رابط آمن HTTPS.';
      }
      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        return 'تم رفض إذن الكاميرا. اسمح للمتصفح باستخدام الكاميرا ثم افتح الماسح مرة أخرى.';
      }
      if (msg.includes('notfound') || msg.includes('no cameras')) {
        return 'لم يتم العثور على كاميرا في هذا الجهاز.';
      }
      return 'تعذّر تشغيل الكاميرا. جرّب تحديث الصفحة، أو استخدم إدخال الباركود اليدوي بالأسفل.';
    };

    const startScanner = async () => {
      try {
        const scannerElement = document.getElementById(SCANNER_ID);
        if (!scannerElement || cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (cameras?.length) {
          const rearCamera = cameras.find(camera => /back|rear|environment|خلف/i.test(camera.label || '')) || cameras[cameras.length - 1];
          await scanner.start(rearCamera.id, config, onDecoded, () => {});
        } else {
          await scanner.start({ facingMode: 'environment' }, config, onDecoded, () => {});
        }
        startedRef.current = true;
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    startTimer = window.setTimeout(startScanner, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      setStarting(false);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      const cleanup = async () => {
        if (!scanner) return;
        try {
          if (startedRef.current) await scanner.stop();
          await scanner.clear();
        } catch {}
        startedRef.current = false;
      };
      cleanup();
    };
  }, [open, onScan]);

  const submitManualCode = () => {
    const code = manualCode.trim();
    if (code) onScan(code);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{continuous ? '🟢 مسح متواصل — وجّه نحو الباركود' : 'مسح الباركود بالكاميرا'}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full rounded-xl overflow-hidden bg-black min-h-[240px]">
          <div id={SCANNER_ID} className="w-full min-h-[240px]" />
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black text-white text-sm">
              <Loader2 className="w-6 h-6 animate-spin" />
              جاري تشغيل الكاميرا...
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-destructive text-center flex items-center justify-center gap-1.5 leading-5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">وجّه الكاميرا نحو الباركود، ويفضل استخدام رابط التطبيق المباشر خارج المعاينة.</p>
        )}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitManualCode()}
            placeholder="أدخل الباركود يدوياً عند تعذر الكاميرا"
          />
          <Button type="button" onClick={submitManualCode}>إدخال</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}