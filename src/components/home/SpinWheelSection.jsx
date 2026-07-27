import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PRIZES = [5, 10, 15, 20, 7, 12, 25, 3];
const COLORS = ['#84cc16', '#65a30d', '#4d7c0f', '#84cc16', '#65a30d', '#4d7c0f', '#84cc16', '#65a30d'];

export default function SpinWheelSection() {
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setLoading(true);

    try {
      const res = await base44.functions.invoke('spin-wheel', {});
      const data = res.data;

      if (data.already_played) {
        // Show existing result without re-spinning
        setResult({ discount: data.discount, code: data.code });
        setSpinning(false);
        setLoading(false);
        toast.info(data.message);
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'فشل التدوير');
        setSpinning(false);
        setLoading(false);
        return;
      }

      // Animate to the server-determined winner
      const winnerIndex = data.winner_index;
      const sliceAngle = 360 / PRIZES.length;
      const targetRotation = 360 * 6 + (360 - winnerIndex * sliceAngle - sliceAngle / 2);
      setRotation(targetRotation);

      setTimeout(() => {
        setResult({ discount: data.discount, code: data.code });
        setSpinning(false);
        setLoading(false);
      }, 4000);
    } catch (err) {
      toast.error('حدث خطأ في الاتصال');
      setSpinning(false);
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(result.code);
    toast.success('تم نسخ كود الخصم');
  };

  return (
    <section className="my-8 px-4">
      <div
        className="rounded-2xl bg-gradient-to-l from-primary/10 to-accent p-5 flex items-center justify-between gap-4 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div>
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> اربح خصم يومي!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">أدر العجلة واحصل على كوبون خصم فوري</p>
        </div>
        <Button size="sm">جرّب حظك</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>عجلة الحظ اليومية</DialogTitle>
          </DialogHeader>

          <div className="relative w-56 h-56 mx-auto my-4">
            <div
              className="w-full h-full rounded-full border-4 border-primary/30 relative overflow-hidden transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '4s' : '0s',
                transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.23, 1)',
                background: `conic-gradient(${PRIZES.map((p, i) => `${COLORS[i]} ${i * (360 / PRIZES.length)}deg ${(i + 1) * (360 / PRIZES.length)}deg`).join(',')})`,
              }}
            >
              {PRIZES.map((p, i) => {
                const angle = (i + 0.5) * (360 / PRIZES.length);
                return (
                  <span
                    key={i}
                    className="absolute top-1/2 left-1/2 text-white font-bold text-xs"
                    style={{ transform: `rotate(${angle}deg) translate(0, -75px) rotate(-${angle}deg)` }}
                  >
                    {p}%
                  </span>
                );
              })}
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-destructive" />
          </div>

          {result ? (
            <div className="space-y-2">
              <p className="font-bold text-primary">🎉 مبروك! ربحت خصم {result.discount}%</p>
              <button onClick={copyCode} className="flex items-center justify-center gap-2 w-full border border-dashed border-primary rounded-lg py-2 text-sm font-bold">
                {result.code} <Copy className="w-3.5 h-3.5" />
              </button>
              <p className="text-xs text-muted-foreground">استخدم الكود عند الدفع. عد غداً لفرصة جديدة!</p>
            </div>
          ) : (
            <Button onClick={spin} disabled={spinning || loading} className="w-full">
              {spinning ? 'جاري التدوير...' : 'أدر العجلة'}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}