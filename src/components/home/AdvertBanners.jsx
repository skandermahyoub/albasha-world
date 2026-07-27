import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';


// This component displays 4 promotional banners
export default function AdvertBanners({ banners = [] }) {
  if (!banners || banners.length === 0) return null;

  const activeBanners = banners.filter(b => b.is_active !== false).slice(0, 4);
  if (activeBanners.length === 0) return null;

  return (
    <section className="my-8 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeBanners.map((banner, i) => (
          <motion.div
            key={banner.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
          >
            <div className="aspect-[16/7] relative">
              {banner.image ? (
                <img
                  src={banner.image}
                  alt={banner.title || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6">
                {banner.title && (
                  <h3 className="text-white font-heading font-bold text-lg md:text-xl mb-1">{banner.title}</h3>
                )}
                {banner.subtitle && (
                  <p className="text-white/80 text-sm mb-3">{banner.subtitle}</p>
                )}
                {banner.button_text && (
                  <div>
                    <Link
                      to={banner.button_link || '/shop'}
                      className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 py-2 rounded-full font-bold transition-colors"
                    >
                      {banner.button_text}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}