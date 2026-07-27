import { motion } from 'framer-motion';

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header skeleton */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-28 h-4 rounded bg-secondary animate-pulse" />
              <div className="w-40 h-3 rounded bg-secondary/70 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-lg bg-secondary animate-pulse" />
            <div className="w-9 h-9 rounded-lg bg-secondary animate-pulse" />
            <div className="w-9 h-9 rounded-lg bg-secondary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="w-full h-48 md:h-64 rounded-2xl bg-secondary animate-pulse" />

        {/* Marquee skeleton */}
        <div className="mt-3 h-8 rounded-lg bg-secondary/70 animate-pulse" />

        {/* Category pills */}
        <div className="mt-4 flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-20 h-20 rounded-2xl bg-secondary animate-pulse shrink-0" />
          ))}
        </div>

        {/* Section title */}
        <div className="mt-6 flex items-center justify-between">
          <div className="w-32 h-6 rounded bg-secondary animate-pulse" />
          <div className="w-16 h-4 rounded bg-secondary/70 animate-pulse" />
        </div>

        {/* Product grid skeleton */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border/50 overflow-hidden"
            >
              <div className="w-full h-32 bg-secondary animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="w-3/4 h-4 rounded bg-secondary animate-pulse" />
                <div className="w-1/2 h-3 rounded bg-secondary/70 animate-pulse" />
                <div className="flex justify-between items-center mt-2">
                  <div className="w-12 h-5 rounded bg-secondary animate-pulse" />
                  <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Second section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border">
        <div className="flex justify-around py-3 max-w-lg mx-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}