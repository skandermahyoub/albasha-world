import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AdminPasswordGuard from '@/components/AdminPasswordGuard';
import useTheme from '@/lib/useTheme';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { useAdminPermissions, pathToPermissionKey } from '@/lib/useAdminPermissions';
import { NoPermission } from '@/components/admin/PermissionGate';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { 
  LayoutDashboard, Package, Tags, ShoppingCart, Image, Type,
  Megaphone, Star, Building2, FileText, MessageSquare, CreditCard,
  Settings, Trophy, Layers, Moon, Sun, ArrowRight, Users, Bell, BarChart2,
  Video, UserCheck, Wand2, Store, Megaphone as BannerIcon, UserCog, Gift, Repeat, Facebook, ScanBarcode, Calculator, Brain,
  Users2, ShoppingCart as CartIcon, Wallet, Truck, Undo2, Truck as TruckIcon, ClipboardList, ScrollText, Ticket, Map,
  Sparkles, Palette, Ship, ShieldCheck, BadgeCheck
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, exact: true },
  { to: '/admin/settings', label: 'الإعدادات العامة', icon: Settings },
  { to: '/admin/products', label: 'المنتجات', icon: Package },
  { to: '/admin/categories', label: 'التصنيفات', icon: Tags },
  { to: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
  { to: '/admin/cashier', label: 'نقطة البيع (الكاشير)', icon: ScanBarcode },
  { to: '/admin/accounting', label: 'النظام المحاسبي', icon: Calculator },
  { to: '/admin/smart-manager', label: 'المدير الذكي', icon: Brain },
  { to: '/admin/slides', label: 'السلايدر', icon: Image },
  { to: '/admin/banners', label: 'البانرات الإعلانية', icon: BannerIcon },
  { to: '/admin/home-highlights', label: 'مميزات الرئيسية', icon: BadgeCheck },
  { to: '/admin/offers', label: 'العروض', icon: Megaphone },
  { to: '/admin/bundles', label: 'الباقات', icon: Layers },
  { to: '/admin/marquee', label: 'الشريط النصي', icon: Type },
  { to: '/admin/reviews', label: 'تقييمات وآراء العملاء', icon: Star },
  { to: '/admin/brands', label: 'العلامات التجارية', icon: Building2 },
  { to: '/admin/blog', label: 'المدونة', icon: FileText },
  { to: '/admin/messages', label: 'الرسائل والإشعارات', icon: MessageSquare },
  { to: '/admin/payments', label: 'طرق الدفع', icon: CreditCard },
  { to: '/admin/contests', label: 'المسابقات', icon: Trophy },
  { to: '/admin/subscribers', label: 'مشتركو النشرة البريدية', icon: Users },
  { to: '/admin/erp', label: 'نظام ERP', icon: BarChart2 },
  { to: '/admin/gallery', label: 'معرض الصور', icon: Image },
  { to: '/admin/surveys', label: 'الاستطلاعات', icon: FileText },
  { to: '/admin/videos', label: 'معرض الفيديو', icon: Video },
  { to: '/admin/crm', label: 'نظام CRM', icon: UserCheck },
  { to: '/admin/employees', label: 'الموظفين', icon: UserCog },
  { to: '/admin/store-configs', label: 'إعدادات الأقسام (الفروع)', icon: Store },
  { to: '/admin/ai-tools', label: 'أدوات الذكاء الاصطناعي', icon: Wand2 },
  { to: '/admin/image-gallery', label: 'معرض صور الذكاء', icon: Sparkles },
  { to: '/admin/store-identity', label: 'هوية النشاطات', icon: Palette },
  { to: '/admin/coupons', label: 'كوبونات الخصم', icon: Ticket },
  { to: '/admin/gift-cards', label: 'بطاقات الهدايا', icon: Gift },
  { to: '/admin/social-posts', label: 'منشورات السوشيال ميديا', icon: Facebook },
  { to: '/admin/affiliates', label: 'التسويق بالعمولة', icon: Users2 },
  { to: '/admin/abandoned-carts', label: 'السلات المتروكة', icon: CartIcon },
  { to: '/admin/wallets', label: 'المحافظ الرقمية', icon: Wallet },
  { to: '/admin/delivery', label: 'إدارة المندوبين', icon: Truck },
  { to: '/admin/shipping', label: 'مناطق الشحن والتوصيل', icon: Ship },
  { to: '/admin/returns', label: 'المرتجعات (RMA)', icon: Undo2 },
  { to: '/admin/suppliers', label: 'الموردين', icon: TruckIcon },
  { to: '/admin/purchase-orders', label: 'أوامر الشراء', icon: ClipboardList },
  { to: '/admin/audit-log', label: 'سجل النشاط', icon: ScrollText },
  { to: '/admin/tickets', label: 'نظام التذاكر', icon: Ticket },
  { to: '/admin/dev-roadmap', label: 'نظام أوريكس V3.4', icon: Map },
  { to: '/admin/system-admins', label: 'مديري النظام', icon: ShieldCheck },
  { to: '/admin/system-accounts', label: 'حسابات النظام', icon: Wallet },
];

export default function AdminDashboard() {
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useStoreSettings();
  const { canView, loading: permLoading } = useAdminPermissions();
  const storeName = settings?.store_name || 'متجري';

  const visibleNavItems = navItems.filter(item => {
    if (!item.to || item.to === '/admin') return true;
    const permKey = pathToPermissionKey(item.to);
    if (!permKey) return true;
    return canView(permKey);
  });

  const currentPermKey = pathToPermissionKey(location.pathname);
  const canAccessCurrent = !currentPermKey || canView(currentPermKey);

  return (
    <AdminPasswordGuard>
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar - Desktop only in flow, Mobile is overlay */}
      <aside className="hidden md:flex md:flex-col md:sticky md:top-0 h-screen w-64 shrink-0 bg-card border-l border-border overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold">{storeName}</h2>
            <p className="text-xs text-muted-foreground">لوحة التحكم</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        <nav className="p-2 space-y-0.5 flex-1">
          {visibleNavItems.map(item => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to) && item.to !== '/admin';
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-2">
            <ArrowRight className="w-4 h-4" /> العودة للمتجر
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[60] md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-card border-l border-border z-[70] overflow-y-auto md:hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold">{storeName}</h2>
                <p className="text-xs text-muted-foreground">لوحة التحكم</p>
              </div>
              <Button variant="ghost" size="icon" onClick={toggle}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
            <nav className="p-2 space-y-0.5">
              {visibleNavItems.map(item => {
                const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to) && item.to !== '/admin';
                return (
                  <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-border">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-2">
                <ArrowRight className="w-4 h-4" /> العودة للمتجر
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <main className="flex-1 min-h-screen min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>☰ القائمة</Button>
        </header>
        <div className="p-4 md:p-6">
          {permLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !canAccessCurrent ? (
            <NoPermission />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
    </AdminPasswordGuard>
  );
}