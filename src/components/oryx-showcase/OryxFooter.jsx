import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ORYX_LOGO, ORYX_COMPANY, ORYX_LOCATION, ORYX_WHATSAPP_LINK } from '@/lib/oryxConfig';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.126 1.532 5.863L.063 23.52a.75.75 0 00.917.917l5.657-1.469A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

export default function OryxFooter() {
  return (
    <footer className="relative py-16 px-4 border-t border-border overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-5"
        >
          <div className="bg-white rounded-2xl p-3 shadow-xl shadow-black/10 border border-border/40 inline-block">
            <img src={ORYX_LOGO} alt="Oryx" className="h-16 md:h-20 w-auto object-contain" />
          </div>
        </motion.div>

        {/* Company name */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading font-black text-2xl md:text-3xl text-gradient-luxury mb-2"
        >
          {ORYX_COMPANY}
        </motion.h2>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-2"
        >
          <MapPin className="w-4 h-4 text-primary" />
          {ORYX_LOCATION}
        </motion.div>

        <p className="text-sm text-muted-foreground mb-7">منصة تجارة إلكترونية متكاملة — صُممت بأحدث التقنيات العالمية</p>

        {/* WhatsApp inquiry button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <a href={ORYX_WHATSAPP_LINK} target="_blank" rel="noreferrer">
            <Button size="lg" className="gap-2 h-12 px-7 font-bold shadow-lg shadow-primary/25">
              <WhatsAppIcon />
              مراسلة واتساب للاستفسار
            </Button>
          </a>
        </motion.div>

        {/* Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <span>© {new Date().getFullYear()} {ORYX_COMPANY}</span>
          <span>•</span>
          <span>جميع الحقوق محفوظة</span>
        </div>
      </div>
    </footer>
  );
}