import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldCheck, Globe, Check, X, Send, Sparkles, Layers, Clock, TrendingUp, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const ACTIVATION_NUMBER = '967777313313';

const VALUE_PILLARS = [
  { icon: Clock, label: 'توفير الوقت والجهد', desc: 'كل العمليات في مكان واحد' },
  { icon: TrendingUp, label: 'نمو وانتشار أسرع', desc: 'أدوات تسويق ذكية مدمجة' },
  { icon: Layers, label: 'منظومة موحدة', desc: '٩ أنظمة في تطبيق واحد' },
];

const TERMS_SECTIONS = [
  {
    title: 'أولاً: التعريف والمنظومة',
    body: 'يُعدّ "نظام أوريكس V4.1 (Oryx V4.1)" منظومة رقمية موحدة لإدارة المتاجر الإلكترونية، تجمع في تطبيق واحد أنظمة التجارة، نقاط البيع، المخزون، العملاء، الولاء، التسويق بالعمولة، المحاسبة، والتوصيل. بتقديم طلب التفعيل يُعدّ المتجر (المُرخّص له) مُوافقاً على الاستخدام وفق هذه الاتفاقية.',
  },
  {
    title: 'ثانياً: الترخيص والملكية',
    body: 'تمنح منصة أوريكس المتجر ترخيصاً غير حصري وغير قابل للتحويل لاستخدام النظام في إدارة نشاطه التجاري. تبقى جميع حقوق الملكية الفكرية للمنصة وأدواتها ونماذجها الذكية ملكاً حصرياً لأوريكس. يُمنع إعادة بيع النظام أو تأجيره أو مشاركة بيانات الدخول مع أطراف خارجية.',
  },
  {
    title: 'ثالثاً: التخصيص والتسليم',
    body: 'عند الموافقة على هذه الشروط، يبدأ فريق أوريكس بتخصيص النسخة بالكامل لمتجر العميل — شاملاً الهوية البصرية، الأقسام، المنتجات، طرق الدفع، أرقام التواصل، والإعدادات. لا يُسلّم التطبيق نهائياً للعميل إلا بعد إتمام التخصيص الكامل وموافقته على النتيجة. يدخل النظام حيّز التشغيل فور تسليم بيانات الدخول.',
  },
  {
    title: 'رابعاً: حقوق المتجر وصاحبه',
    body: 'يحق للمتجر إدارة محتواه ومنتجاته وأسعاره وعروضه بالكامل، والوصول إلى بياناته وتقاريره في أي وقت، وطلب التعديلات والتطويرات المتفق عليها. يلتزم المتجر بإدخال بيانات دقيقة وصحيحة، وعدم استخدام النظام في أنشطة مخالفة للقانون أو تتعلق بمنتجات محظورة.',
  },
  {
    title: 'خامساً: حقوق العميل (المستخدم النهائي)',
    body: 'يضمن النظام للعميل النهائي: حفظ بياناته وخصوصيته وعدم مشاركتها دون إذن، حقه في الاطلاع على حالة طلبه وتتبعه، حقه في الإرجاع والاسترداد وفق سياسة المتجر، حقه في تقييم المنتجات والخدمة بحرية، وحقه في الدعم الفني عبر قنوات التواصل المعتمدة. تُحفظ حقوق العميل التجارية كاملةً ولا يجوز للمتجر الانتقاص منها.',
  },
  {
    title: 'سادساً: المحتوى والعملية التجارية',
    body: 'يتحمّل المتجر المسؤولية الكاملة عن محتواه ومنتجاته وأوصافه وصوره وأسعاره. تتم العملية التجارية (الطلب، الدفع، التوصيل، الإرجاع) بين المتجر والعميل مباشرةً، وتكون أوريكس وسيطاً تقنياً لتشغيل النظام فقط وليس طرفاً في العقد التجاري.',
  },
  {
    title: 'سابعاً: الضمان التجاري',
    body: 'تضمن أوريكس استمرارية تشغيل النظام وصيانته وتحديثاته الأمنية طوال فترة الاشتراك السارية، ونسخ احتياطية دورية للبيانات، ودعماً فنياً للأعطال التقنية. لا يُضمن النظام نتائج مبيعات أو أرباحاً محددة، إذ تعتمد على إدارة المتجر وظروف السوق. أي توقف اضطراري يُعوّض بنسبة مدة التوقف من الاشتراك.',
  },
  {
    title: 'ثامناً: الاشتراك والدفع',
    body: 'يخضع استخدام النظام لاشتراك موحّد يغطّي المنظومة كاملة. تُحدّد قيمة الاشتراك ودورة الدفع عند تفعيل النسخة. في حال تأخر سداد الاشتراك أكثر من ١٤ يوماً، يحق للمنصة تعليق الخدمة مؤقتاً حتى السداد دون فقدان البيانات. يُعطى المتجر فترة سماح وإشعار مسبق قبل أي تعليق.',
  },
  {
    title: 'تاسعاً: الخصوصية وحماية البيانات',
    body: 'تُعالج بيانات المتجر وعملائه وفق سياسة الخصوصية المعتمدة. لا تُستخدم بيانات العملاء لأغراض تسويقية دون موافقتهم. يحق للمتجر طلب تصدير بياناته أو حذفها عند إنهاء الاشتراك، مع احتفاظ المنصة بسجلات المعاملات المالية للمدة التي يلزمها القانون.',
  },
  {
    title: 'عاشراً: حدود المسؤولية',
    body: 'تقتصر مسؤولية أوريكس على تشغيل النظام وصيانته وفق هذه الشروط، ولا تتحمل مسؤولية قرارات المتجر التجارية أو خسائره أو نزاعاته مع عملائه. الحد الأقصى لمسؤولية المنصة المالية لا يتجاوز قيمة الاشتراك المدفوع عن الشهر الذي وقع فيه الضرر المُطالب به.',
  },
  {
    title: 'حادي عشر: الموافقة وتفعيل التسليم',
    body: 'بالضغط على "أوافق وأرغب في تفعيل النسخة" يُسجَّل قبول المتجر الصريح لهذه الشروط بالكامل، ويُرسل طلب التفعيل تلقائياً إلى فريق أوريكس عبر واتساب الأعمال، ويبدأ إجراء التخصيص والتسليم. في حال عدم الموافقة، يُرجى توضيح الأسباب لمراعاتها وتطوير النظام بما يلائم رؤية المتجر.',
  },
];

export default function ActivationHero() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineSubmitted, setDeclineSubmitted] = useState(false);

  const sendActivationRequest = () => {
    const msg = `مرحباً فريق أوريكس،%0A%0Aأرغب في طلب تفعيل نسخة نظام أوريكس V4.1 (Oryx V4.1) لمتجري.%0A%0Aلقد اطلعت على الشروط والأحكام وأوافق عليها، وأرغب في بدء إجراءات التخصيص والتسليم.%0A%0Aأرجو التواصل معي لإتمام التفعيل.%0A%0Aشكراً.`;
    window.open(`https://wa.me/${ACTIVATION_NUMBER}?text=${msg}`, '_blank');
  };

  const handleApprove = () => {
    setApproved(true);
    setTermsOpen(false);
    sendActivationRequest();
  };

  const handleDeclineSubmit = () => {
    setDeclineSubmitted(true);
    if (declineReason.trim()) {
      const msg = `مرحباً فريق أوريكس،%0A%0Aبعد الاطلاع على شروط استخدام نظام أوريكس V4.1، لا أوافق حالياً للأسباب التالية:%0A%0A${encodeURIComponent(declineReason)}%0A%0Aأرجو أخذ رؤيتي بعين الاعتبار.`;
      window.open(`https://wa.me/${ACTIVATION_NUMBER}?text=${msg}`, '_blank');
    }
  };

  return (
    <section className="relative overflow-hidden py-24 px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">منظومة رقمية موحدة — أوريكس V4.1</span>
          </div>

          <h2 className="font-heading font-black text-4xl md:text-6xl mb-5 leading-tight">
            <span className="text-gradient-luxury">كل هذا وأكثر...</span>
            <br />
            في نظام واحد
          </h2>

          <p className="text-base md:text-lg text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed mb-4">
            منظومة رقمية موحدة بأحدث التقنيات الذكية المتقدمة، صُمّمت لتوفير الوقت والجهد والمال
            في تجارة مريحة وسريعة وأكثر نمواً وانتشاراً.
          </p>

          <p className="text-sm md:text-base text-foreground/80 font-body max-w-2xl mx-auto leading-relaxed">
            مع <span className="font-bold text-primary">أوريكس V4.1</span> تجارة بعلم وبصيرة، وبأدوات
            مساعدة ذكية تغنيك عن التأجيل والتأخير في معرفة أحوال تجارتك.
          </p>
        </motion.div>

        {/* Value pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {VALUE_PILLARS.map((p, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-sm mb-1">{p.label}</h3>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Price card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-primary via-accent to-primary" />
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-bold text-muted-foreground tracking-wider mb-2">سعر النظام</span>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-heading font-black text-5xl md:text-6xl text-gradient-luxury">اشتراك واحد</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">يغطّي المنظومة الرقمية الموحدة كاملة</p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-6">
              {[
                { value: '٩', label: 'أنظمة متكاملة' },
                { value: '١٠+', label: 'أدوات تشغيل وتحليل' },
                { value: '٤٠+', label: 'صفحة إدارية' },
              ].map((item, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl py-3">
                  <div className="font-heading font-black text-2xl text-primary">{item.value}</div>
                  <div className="text-[11px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="line-through opacity-60">بدلاً من ٩ اشتراكات منفصلة</span>
              <span className="font-bold text-primary">سعر واحد موحّد</span>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            onClick={sendActivationRequest}
            size="lg"
            className="w-full sm:w-auto gap-2 h-14 px-8 text-base font-bold shadow-lg shadow-primary/30"
          >
            <Rocket className="w-5 h-5" />
            طلب تفعيل النسخة
          </Button>

          <Button
            onClick={() => setTermsOpen(true)}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 h-14 px-8 text-base font-bold"
          >
            <ShieldCheck className="w-5 h-5 text-primary" />
            الشروط والأحكام
          </Button>

          <a href="https://oryx.business" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-2 h-14 px-8 text-base font-bold"
            >
              <Globe className="w-5 h-5 text-primary" />
              تعرّف أكثر على أوريكس
            </Button>
          </a>
        </motion.div>

        {/* Approval success state */}
        <AnimatePresence>
          {approved && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 glass-card rounded-2xl p-6 text-center border border-primary/30 bg-primary/5"
            >
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-primary-foreground" strokeWidth={3} />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">تم تسجيل موافقتك بنجاح</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                شكراً لك! تم إرسال طلب التفعيل إلى فريق أوريكس عبر واتساب الأعمال. سيتم التواصل معك
                لبدء إجراءات تخصيص النسخة بالكامل لمتجرك، ثم تُسلَّم إليك جاهزة للتشغيل التجاري المباشر.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decline feedback */}
        <AnimatePresence>
          {declineSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 glass-card rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-bold text-base mb-1">شكراً لمشاركتك</h3>
              <p className="text-sm text-muted-foreground">تم إرسال ملاحظاتك إلى فريق أوريكس — رؤيتك تساعدنا على التطوير.</p>
            </motion.div>
          ) : showDecline ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 glass-card rounded-2xl p-6"
            >
              <label className="text-sm font-bold mb-2 block">
                توضيح أسباب عدم الموافقة وشرح فكرتك ورؤيتك <span className="text-muted-foreground font-normal">(اختياري)</span>
              </label>
              <Textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={4}
                placeholder="شاركنا الأسباب الحقيقية لعدم موافقتك وفكرتك ورؤيتك لمتجرك..."
                className="resize-none mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={handleDeclineSubmit} size="sm" className="gap-1.5">
                  <Send className="w-4 h-4" /> إرسال الملاحظات
                </Button>
                <Button onClick={() => setShowDecline(false)} variant="ghost" size="sm">إلغاء</Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Terms Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl">
              <FileText className="w-5 h-5 text-primary" />
              الشروط والأحكام لتفعيل نظام أوريكس V4.1
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {TERMS_SECTIONS.map((s, i) => (
              <div key={i} className="border-r-2 border-primary/30 pr-4">
                <h4 className="font-heading font-bold text-sm mb-1.5 text-foreground">{s.title}</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed font-body">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-5 mt-2 flex flex-col gap-2">
            <Button onClick={handleApprove} className="w-full h-12 gap-2 font-bold">
              <Check className="w-5 h-5" />
              أوافق وأرغب في تفعيل النسخة
            </Button>
            <Button
              onClick={() => { setTermsOpen(false); setShowDecline(true); }}
              variant="outline"
              className="w-full h-12 gap-2 font-medium"
            >
              <X className="w-4 h-4" />
              لا أوافق — أرغب في توضيح الأسباب
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}