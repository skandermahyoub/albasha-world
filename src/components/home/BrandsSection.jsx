import { motion } from 'framer-motion';

export default function BrandsSection({ brands = [] }) {
  const activeBrands = brands.filter(b => b.is_active !== false);
  if (activeBrands.length === 0) return null;

  return (
    <section className="my-10 px-4">
      <h2 className="font-heading font-bold text-2xl text-center mb-2">العلامات التجارية</h2>
      <p className="text-center text-muted-foreground text-sm mb-8">نتعامل مع أفضل العلامات العالمية</p>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 to-accent p-8 border border-primary/10">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-primary/10 blur-xl" />
        
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 relative z-10">
          {activeBrands.map((brand, i) => (
            <motion.div
              key={brand.id || i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.1 }}
              className="aspect-square rounded-xl bg-card border border-border/50 p-3 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {brand.name?.[0]}
                </div>
              )}
              <span className="text-[10px] text-center text-muted-foreground font-medium leading-tight">{brand.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}