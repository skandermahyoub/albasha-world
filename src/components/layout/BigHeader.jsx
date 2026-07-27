import { motion } from 'framer-motion';
import { useStoreSettings } from '@/lib/useStoreSettings';

export default function BigHeader({ settings: propSettings }) {
  const { settings: ctxSettings } = useStoreSettings();
  const settings = { ...ctxSettings, ...propSettings };
  const logoUrl = settings?.logo_url || '';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-background flex flex-col items-center justify-center py-8 relative overflow-hidden"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="relative z-10"
      >
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-primary/30 shadow-xl pulse-glow bg-primary/10 flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={settings?.store_name || 'متجري'} className="w-full h-full object-cover" />
          ) : (
            <span className="font-heading font-black text-5xl text-primary">{(settings?.store_name || 'ع')[0]}</span>
          )}
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-2xl md:text-3xl font-heading font-bold text-foreground"
      >
        {settings?.store_name || 'متجري'}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-muted-foreground font-body mt-1"
      >
        {settings?.slogan || ''}
      </motion.p>
    </motion.header>
  );
}