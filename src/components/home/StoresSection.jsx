import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { STORE_SECTIONS } from '@/lib/storeSections';

const STORE_META = STORE_SECTIONS.map(s => ({
  key: s.key,
  name: s.nameAr,
  nameEn: s.nameEn,
  icon: s.icon,
  desc: s.desc,
  color: s.color,
  fallbackImage: s.fallbackImage,
}));

export default function StoresSection() {
  const { settings } = useStoreSettings();
  const [storeConfigs, setStoreConfigs] = useState({});

  useEffect(() => {
    const loadConfigs = async () => {
      const configs = await base44.entities.StoreConfig.list().catch(() => []);
      const configMap = {};
      configs.forEach(cfg => {
        configMap[cfg.store_key] = cfg;
      });
      setStoreConfigs(configMap);
    };
    loadConfigs();
  }, []);

  return (
    <section className="my-10 px-4">
      <div className="text-center mb-8">
        <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">{settings?.store_name || 'عالم الباشا للتسوق'}</h2>
        <p className="text-muted-foreground text-sm">اختر قسمك المفضل من عالمنا المتكامل</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {STORE_META.map((store, i) => {
          const config = storeConfigs[store.key];
          const displayImage = config?.bg_images?.[0] || store.fallbackImage;
          
          return (
            <motion.div
              key={store.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/store/${store.key}`} className="block group">
                <div
                  className="relative rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ borderColor: store.color + '4D', background: `linear-gradient(135deg, ${store.color}1A, ${store.color}0A)` }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={displayImage}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = store.fallbackImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <store.icon className="w-5 h-5" style={{ color: store.color }} />
                        <span className="text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full" style={{ color: store.color }}>
                          {store.nameEn}
                        </span>
                      </div>
                      <h3 className="text-white font-heading font-bold text-base leading-tight">{store.name}</h3>
                      <p className="text-white/70 text-xs mt-0.5">{store.desc}</p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center transition-colors"
                      style={{ ['--tw-bg-opacity']: 1 }}
                    >
                      <ArrowLeft className="w-4 h-4 text-white group-hover:translate-x-[-4px] transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
      </div>
    </section>
  );
}