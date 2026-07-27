import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { StoreSettingsProvider, useStoreSettings } from '@/lib/useStoreSettings';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { migrateLocalStorage } from '@/lib/localStorageMigration';

migrateLocalStorage();

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Favorites from './pages/Favorites';
import Compare from './pages/Compare';
import OrderTracking from './pages/OrderTracking';
import Blog from './pages/Blog';
import BlogPostPage from './pages/BlogPost';
import Loyalty from './pages/Loyalty';
import Contact from './pages/Contact';
import Contests from './pages/Contests';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHome from './pages/admin/AdminHome';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSlides from './pages/admin/AdminSlides';
import AdminMarquee from './pages/admin/AdminMarquee';
import AdminOffers from './pages/admin/AdminOffers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBrands from './pages/admin/AdminBrands';
import AdminBlog from './pages/admin/AdminBlog';
import AdminMessages from './pages/admin/AdminMessages';
import AdminPayments from './pages/admin/AdminPayments';
import AdminBundles from './pages/admin/AdminBundles';
import AdminContests from './pages/admin/AdminContests';
import AdminSubscribers from './pages/admin/AdminSubscribers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminERP from './pages/admin/AdminERP';
import AdminGallery from './pages/admin/AdminGallery';
import AdminSurveys from './pages/admin/AdminSurveys';
import AdminBanners from './pages/admin/AdminBanners';
import AdminVideos from './pages/admin/AdminVideos';
import AdminCRM from './pages/admin/AdminCRM';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminStoreConfigs from './pages/admin/AdminStoreConfigs';
import AdminAITools from './pages/admin/AdminAITools';
import AdminImageGallery from './pages/admin/AdminImageGallery';
import AdminStoreIdentity from './pages/admin/AdminStoreIdentity';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminGiftCards from './pages/admin/AdminGiftCards';
import AdminSocialPosts from './pages/admin/AdminSocialPosts';
import AdminCashier from './pages/admin/AdminCashier';
import AdminAccounting from './pages/admin/AdminAccounting';
import AdminSmartManager from './pages/admin/AdminSmartManager';
import AdminAffiliates from './pages/admin/AdminAffiliates';
import AdminAbandonedCarts from './pages/admin/AdminAbandonedCarts';
import AdminWallets from './pages/admin/AdminWallets';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminReturns from './pages/admin/AdminReturns';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminPurchaseOrders from './pages/admin/AdminPurchaseOrders';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminTickets from './pages/admin/AdminTickets';
import AdminDevRoadmap from './pages/admin/AdminDevRoadmap';
import AdminSystemAdmins from './pages/admin/AdminSystemAdmins';
import AdminSystemAccounts from './pages/admin/AdminSystemAccounts';
import AdminShipping from './pages/admin/AdminShipping';
import Videos from './pages/Videos';
import WishLists from './pages/WishLists';
import SharedWishlist from './pages/SharedWishlist';
import GiftCards from './pages/GiftCards';
import Gallery from './pages/Gallery';
import StorePage from './pages/StorePage';
import MyAccount from './pages/MyAccount';
import UserGuide from './pages/UserGuide';
import MyWallet from './pages/MyWallet';
import AffiliateDashboard from './pages/AffiliateDashboard';
import Returns from './pages/Returns';
import Tickets from './pages/Tickets';
import RecoverCart from './pages/RecoverCart';
import SurveyPage from './pages/SurveyPage';
import SurveyPopup from '@/components/SurveyPopup';
import BottomNav from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import NotificationSystem from '@/components/NotificationSystem';


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { loading: settingsLoading } = useStoreSettings();

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/store/:storeKey" element={<StorePage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/order-tracking" element={<OrderTracking />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPostPage />} />
        <Route path="/loyalty" element={<Loyalty />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/survey/:id" element={<SurveyPage />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/wishlists" element={<WishLists />} />
        <Route path="/wishlist/:token" element={<SharedWishlist />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/guide" element={<UserGuide />} />
        <Route path="/my-wallet" element={<MyWallet />} />
        <Route path="/affiliate" element={<AffiliateDashboard />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/recover-cart/:token" element={<RecoverCart />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminHome />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="slides" element={<AdminSlides />} />
          <Route path="marquee" element={<AdminMarquee />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="bundles" element={<AdminBundles />} />
          <Route path="contests" element={<AdminContests />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="erp" element={<AdminERP />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="surveys" element={<AdminSurveys />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="crm" element={<AdminCRM />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="store-configs" element={<AdminStoreConfigs />} />
          <Route path="ai-tools" element={<AdminAITools />} />
          <Route path="image-gallery" element={<AdminImageGallery />} />
          <Route path="store-identity" element={<AdminStoreIdentity />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="gift-cards" element={<AdminGiftCards />} />
          <Route path="social-posts" element={<AdminSocialPosts />} />
          <Route path="cashier" element={<AdminCashier />} />
          <Route path="accounting" element={<AdminAccounting />} />
          <Route path="smart-manager" element={<AdminSmartManager />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
          <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
          <Route path="wallets" element={<AdminWallets />} />
          <Route path="delivery" element={<AdminDelivery />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="suppliers" element={<AdminSuppliers />} />
          <Route path="purchase-orders" element={<AdminPurchaseOrders />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="dev-roadmap" element={<AdminDevRoadmap />} />
          <Route path="system-admins" element={<AdminSystemAdmins />} />
          <Route path="system-accounts" element={<AdminSystemAccounts />} />
          <Route path="shipping" element={<AdminShipping />} />
      </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <SurveyPopup />
      <InstallPrompt />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <StoreSettingsProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </StoreSettingsProvider>
    </AuthProvider>
  )
}

export default App