import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLevelInfo } from './LevelProgressBar';

export default function VIPCorner({ products = [], format }) {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      if (me) {
        base44.entities.LoyaltyPoints.filter({ user_email: me.email })
          .then(lp => setPoints(lp[0]?.points || 0))
          .catch(() => {});
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const level = getLevelInfo(points);
  const isVIP = points >= 1000; // بلاتيني أو VIP
  const featuredProducts = products.filter(p => p.is_featured && p.status === 'active').slice(0, 4);

  if (loading || featuredProducts.length === 0) return null;

  return (
    <section className="my-14 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-primary/90 to-stone-800" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center"
              >
                <Crown className="w-6 h-6 text-yellow-300" />
              </motion.div>
              <div>
                <h2 className="font-heading font-bold text-2xl text-white">ركن الباشا VIP</h2>
                <p className="text-white/60 text-sm">مجموعة حصرية لعملائنا المميزين</p>
              </div>
            </div>
            <Link to="/shop" className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
              الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {!isVIP && user && (
            <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-300 shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">أنت في مستوى {level.label}</p>
                <p className="text-white/50 text-xs">اجمع {Math.max(0, 1000 - points)} نقطة إضافية للوصول لمزايا البلاتيني الحصرية</p>
              </div>
            </div>
          )}

          {isVIP && (
            <div className="mb-5 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <p className="text-yellow-200 text-sm font-medium">مرحباً يا {user?.full_name?.split(' ')[0] || 'صديقنا'}، هذه المجموعة حصرية لك</p>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={`/product/${product.id}`} className={`block rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-400/40 transition-all duration-300 group ${!isVIP && i >= 2 ? 'opacity-60' : ''}`}>
                  <div className="relative aspect-square">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=300'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {!isVIP && i >= 2 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs font-bold line-clamp-1">{product.title}</p>
                      {product.price && (
                        <p className="text-yellow-300 text-xs font-bold">{format ? format(product.price) : `${product.price} ر.س`}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {!user && (
            <div className="mt-5 text-center">
              <p className="text-white/60 text-sm mb-3">سجل دخولك واجمع النقاط للوصول للمجموعة الحصرية</p>
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="px-6 py-2.5 bg-yellow-400 text-yellow-900 rounded-full font-bold text-sm hover:bg-yellow-300 transition-colors"
              >
                سجل الدخول الآن
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}