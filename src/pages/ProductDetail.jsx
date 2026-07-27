import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCart, useFavorites, useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import useTheme from '@/lib/useTheme';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import SmartRecommendations from '@/components/SmartRecommendations';
import RecentlyViewed, { addToRecentlyViewed } from '@/components/RecentlyViewed';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, ArrowLeftRight, Minus, Plus, ArrowRight, Star, CheckCircle2, XCircle, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import FlashTimer from '@/components/product/FlashTimer';
import WhatsAppOrderBtn from '@/components/product/WhatsAppOrderBtn';
import ProductReviews from '@/components/product/ProductReviews';
import SubscribeButton from '@/components/product/SubscribeButton';
import SocialEngagement from '@/components/social/SocialEngagement';

export default function ProductDetail() {
  const { id } = useParams();
  const { isDark, toggle } = useTheme();
  const { addItem, count: cartCount } = useCart();
  const { toggleFav, isFav } = useFavorites();
  const { toggleCompare, isComparing } = useCompare();
  const [settings, setSettings] = useState(null);
  const currency = useCurrency(settings);
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, products, allProds] = await Promise.all([
        base44.entities.StoreSettings.list().catch(() => []),
        base44.entities.Product.filter({ id }).catch(() => []),
        base44.entities.Product.list('-sales_count', 50).catch(() => []),
      ]);
      setSettings(s[0] || {});
      const p = products[0] || null;
      setProduct(p);
      setAllProducts(allProds);
      if (p) addToRecentlyViewed(p);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return null;

  if (!product) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">المنتج غير موجود</p>
      <Link to="/shop"><Button variant="outline">العودة للمتجر</Button></Link>
    </div>
  );

  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const discountActive = product.old_price && product.old_price > product.price && (!product.discount_end_date || new Date(product.discount_end_date) >= new Date());

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success(`تمت إضافة ${product.title} إلى السلة`);
  };

  const handleShare = () => {
    const shareData = { title: product.title, text: product.subtitle || product.title, url: window.location.href };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ رابط المنتج');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={product.title} description={product.subtitle || product.description} image={product.image} />
      <StickyHeader visible={true} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />
      
      <div className="pt-20 px-4 max-w-5xl mx-auto">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للمتجر
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary mb-3">
              <img src={images[selectedImage] || 'https://images.unsplash.com/photo-1560913210-602903af5079?w=600'} alt={product.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {product.brand && <span className="text-sm text-primary font-medium">{product.brand}</span>}
            <h1 className="font-heading font-bold text-2xl md:text-3xl">{product.title}</h1>
            {product.subtitle && <p className="text-muted-foreground">{product.subtitle}</p>}

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{currency.format(product.price)}</span>
              {discountActive && (
                <span className="text-lg text-muted-foreground line-through">{currency.format(product.old_price)}</span>
              )}
            </div>

            {product.nicotine_level && (
              <div className="text-sm"><span className="text-muted-foreground">مستوى النيكوتين: </span>{product.nicotine_level}</div>
            )}
            {product.flavor && (
              <div className="text-sm"><span className="text-muted-foreground">النكهة: </span>{product.flavor}</div>
            )}

            {product.description && (
              <div className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">{product.description}</div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">الكمية:</span>
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Flash Timer */}
            {discountActive && (
              <FlashTimer endDate={product.discount_end_date} />
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddToCart} className="flex-1 h-12 text-base">
                <ShoppingCart className="w-5 h-5 ml-2" /> أضف للسلة
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => toggleFav(product.id)}>
                <Heart className={`w-5 h-5 ${isFav(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => toggleCompare(product.id)}>
                <ArrowLeftRight className={`w-5 h-5 ${isComparing(product.id) ? 'text-primary' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            <SocialEngagement
              contentType="product"
              contentId={product.id}
              title={product.title}
              shareText={product.subtitle || product.title}
            />

            {/* Subscription */}
            <SubscribeButton product={product} qty={qty} format={currency.format} />

            {/* WhatsApp Order */}
            <WhatsAppOrderBtn product={product} qty={qty} settings={settings} />

            {product.stock !== undefined && (
              <p className={`text-sm inline-flex items-center gap-1.5 ${product.stock > 0 ? 'text-orange-600' : 'text-red-500'}`}>
                {product.stock > 0
                  ? <><CheckCircle2 className="w-4 h-4" /> متوفر ({product.stock} قطعة)</>
                  : <><XCircle className="w-4 h-4" /> غير متوفر حالياً</>}
              </p>
            )}

            {product.sku && (
              <p className="text-xs text-muted-foreground">رمز المنتج: <span className="font-mono">{product.sku}</span></p>
            )}
          </motion.div>
        </div>

        {/* Smart Recommendations */}
        <SmartRecommendations
          currentProduct={product}
          allProducts={allProducts}
          onAddCart={(p) => { addItem(p, 1); toast.success(`تمت إضافة ${p.title} للسلة`); }}
          onToggleFav={toggleFav}
          onToggleCompare={toggleCompare}
          isFav={isFav}
          isComparing={isComparing}
          format={currency.format}
          settings={settings}
        />

        {/* Recently Viewed */}
        <RecentlyViewed format={currency.format} currentId={product.id} />

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />

      </div>
      <Footer settings={settings} />
    </div>
  );
}