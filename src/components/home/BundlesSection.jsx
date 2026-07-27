import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export default function BundlesSection({ bundles = [], format }) {
  const active = bundles.filter(b => b.is_active !== false && b.show_on_home);
  if (active.length === 0) return null;

  return (
    <section className="my-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-6 h-6 text-primary" />
        <h2 className="font-heading font-bold text-2xl">الباقات المميزة</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {active.map((bundle, i) => (
          <motion.div
            key={bundle.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 to-accent rounded-2xl overflow-hidden border border-primary/20 flex flex-col md:flex-row group"
          >
            {bundle.image && (
              <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
                <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            <div className="p-5 flex flex-col justify-center flex-1">
              <h3 className="font-heading font-bold text-lg">{bundle.title}</h3>
              {bundle.description && <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>}
              <div className="flex items-center gap-3 mt-3">
                {bundle.original_price && (
                  <span className="text-sm text-muted-foreground line-through">{format ? format(bundle.original_price) : bundle.original_price}</span>
                )}
                <span className="text-lg font-bold text-primary">{format ? format(bundle.bundle_price) : bundle.bundle_price}</span>
                {bundle.discount_percent > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">خصم {bundle.discount_percent}%</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}