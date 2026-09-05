import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import useTheme from '@/lib/useTheme';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { useCart, useFavorites, useCompare } from '@/lib/useCart';
import useCurrency from '@/lib/useCurrency';
import BigHeader from '@/components/layout/BigHeader';
import StickyHeader from '@/components/layout/StickyHeader';
import Footer from '@/components/layout/Footer';
import HeroSlider from '@/components/home/HeroSlider';
import MarqueeBar from '@/components/home/MarqueeBar';
import OffersCarousel from '@/components/home/OffersCarousel';
import ProductsShowcase from '@/components/home/ProductsShowcase';
import ReviewsSection from '@/components/home/ReviewsSection';
import BrandsSection from '@/components/home/BrandsSection';
import ContactSection from '@/components/home/ContactSection';
import BundlesSection from '@/components/home/BundlesSection';
import StoresSection from '@/components/home/StoresSection';
import BottomNav from '@/components/BottomNav';
import NotificationSystem from '@/components/NotificationSystem';
import SEOHead from '@/components/SEOHead';
import AdvertBanners from '@/components/home/AdvertBanners';
// WhatsAppButton removed - contact via BottomNav chat
import AdaptiveNightMode from '@/components/home/AdaptiveNightMode';
import CartFlyAnimation from '@/components/CartFlyAnimation';
import HomeSkeleton from '@/components/home/HomeSkeleton';

import FacebookFeedSection from '@/components/home/FacebookFeedSection';
import LiveActivityBar from '@/components/home/LiveActivityBar';
import HomeHighlights from '@/components/home/HomeHighlights';
import DailyDealBanner from '@/components/home/DailyDealBanner';
import CategoryProductsSection from '@/components/home/CategoryProductsSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import FloatingCategories from '@/components/FloatingCategories';
import { STORE_KEYS } from '@/lib/storeSections';

// Lazy-loaded below-the-fold sections for faster initial render
const ShortVideosSection = lazy(() => import('@/components/home/ShortVideosSection'));
const SocialFeedSection = lazy(() => import('@/components/home/SocialFeedSection'));
const MagazineSection = lazy(() => import('@/components/home/MagazineSection'));

const SectionFallback = () => null;

export default function Home() {
  const { isDark, toggle } = useTheme();
  const { items: cartItems, addItem, count: cartCount } = useCart();
  const { toggleFav, isFav } = useFavorites();
  const { toggleCompare, isComparing } = useCompare();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const currency = useCurrency(settings);
  const [showSticky, setShowSticky] = useState(false);
  const bigHeaderRef = useRef(null);

  const [slides, setSlides] = useState([]);
  const [marqueeItems, setMarqueeItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [posts, setPosts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const productRequests = [
        ...STORE_KEYS.map(store_key => ({ store_key, sort: '-created_date', limit: 12 })),
        { is_bestseller: true, sort: '-sales_count', limit: 8 },
        { is_featured: true, sort: '-created_date', limit: 8 },
        { is_new: true, sort: '-created_date', limit: 8 },
        { is_coming_soon: true, sort: '-created_date', limit: 8 },
      ];
      const [slidesData, marqueeData, offersData, productPages, reviewsData, brandsData, postsData, bundlesData, bannersData] = await Promise.all([
        base44.entities.HeroSlide.list('sort_order').catch(() => []),
        base44.entities.MarqueeText.list('sort_order').catch(() => []),
        base44.entities.SpecialOffer.list('sort_order').catch(() => []),
        Promise.all(productRequests.map(params => base44.functions.invoke('get-public-products', params).then(res => res.data?.products || []).catch(() => []))),
        base44.functions.invoke('get-public-reviews', { context: 'store' }).then(res => res.data?.reviews || []).catch(() => []),
        base44.entities.Brand.list('sort_order').catch(() => []),
        base44.functions.invoke('get-public-blog-posts', { limit: 10 }).then(res => res.data?.posts || []).catch(() => []),
        base44.entities.Bundle.list('-created_date', 10).catch(() => []),
        base44.entities.AdvertBanner.list('sort_order').catch(() => []),
      ]);
      const productMap = new Map();
      productPages.flat().forEach(product => { if (product?.id) productMap.set(product.id, product); });
      setSlides(slidesData);
      setMarqueeItems(marqueeData);
      setOffers(offersData);
      setProducts([...productMap.values()]);
      setReviews(reviewsData);
      setBrands(brandsData.filter(brand => brand.is_active !== false));
      setPosts(postsData);
      setBundles(bundlesData.filter(bundle => bundle.is_active !== false));
      setBanners(bannersData.filter(banner => banner.is_active !== false));
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // التقاط كود الإحالة (Affiliate) من الرابط
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('affiliate_ref', refCode);
      // تسجيل نقرة على رابط المسوق عبر الخادم (منع التكرar)
      base44.functions.invoke('track-affiliate-click', { affiliate_code: refCode }).catch(() => {});
    }
  }, []);

  if (!settings) return <HomeSkeleton />;

  return (
    <div className="min-h-screen bg-background relative">
      <SEOHead
        title={settings?.store_name}
        description={settings?.slogan}
        image={settings?.logo_url}
      />
      <AdaptiveNightMode isDark={isDark} settings={settings} />
      <CartFlyAnimation />
      
      {/* Big Header */}
      <div ref={bigHeaderRef}>
        <BigHeader settings={settings} />
      </div>

      {/* Sticky Header */}
      <StickyHeader visible={showSticky} cartCount={cartCount} isDark={isDark} toggleTheme={toggle} settings={settings} />

      {/* Hero Slider */}
      <HeroSlider slides={slides} />

      {/* Marquee */}
      <MarqueeBar items={marqueeItems} />

      {/* Live Activity */}
      <LiveActivityBar />

      {/* Creator Community */}
      

      {/* Highlights managed from admin */}
      <HomeHighlights />

      {/* Stores Section */}
      <StoresSection />

      {/* Category Grid (from DB) */}
      <CategoryGrid />

      {/* Daily Deal */}
      <DailyDealBanner products={products} format={currency.format} />

      {/* Offers */}
      <OffersCarousel offers={offers} />

      {/* Category Products */}
      <CategoryProductsSection
        products={products}
        onAddCart={addItem}
        onToggleFav={toggleFav}
        onToggleCompare={toggleCompare}
        isFav={isFav}
        isComparing={isComparing}
        format={currency.format}
        settings={settings}
      />

      {/* Spin & Win */}
      

      {/* Bundles */}
      <BundlesSection bundles={bundles} format={currency.format} />

      {/* Refer a Friend */}
      



      {/* Products Showcase */}
      <ProductsShowcase
        products={products}
        onAddCart={addItem}
        onToggleFav={toggleFav}
        onToggleCompare={toggleCompare}
        isFav={isFav}
        isComparing={isComparing}
        format={currency.format}
        settings={settings}
      />

      {/* Short Videos */}
      <Suspense fallback={<SectionFallback />}><ShortVideosSection /></Suspense>

      {/* Social Feed */}
      <Suspense fallback={<SectionFallback />}><SocialFeedSection /></Suspense>

      {/* Reviews */}
      <ReviewsSection reviews={reviews} />

      {/* Brands */}
      <BrandsSection brands={brands} />

      {/* Advert Banners */}
      <AdvertBanners banners={banners} />

      {/* Features */}


      {/* VIP Corner */}
      

      {/* Facebook Feed */}
      <FacebookFeedSection />

      {/* Magazine Section */}
      <Suspense fallback={<SectionFallback />}><MagazineSection posts={posts} /></Suspense>

      {/* Contact */}
      <ContactSection settings={settings} />

      {/* Footer */}
      <Footer settings={settings} />

      {/* Bottom Navigation */}
      <div className="h-20" />
      <BottomNav settings={settings} />

      <NotificationSystem />
      <FloatingCategories />
    </div>
  );
}