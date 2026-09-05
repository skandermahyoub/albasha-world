import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, X, LayoutGrid, Menu } from 'lucide-react';
import { useCart } from '@/lib/useCart';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getNavLinks, getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { useAuth } from '@/lib/AuthContext';
import useStaffAccess from '@/lib/useStaffAccess';

export default function BottomNav({ settings: propSettings }) {
  const { settings: ctxSettings } = useStoreSettings();
  const { user } = useAuth();
  const { isStaff } = useStaffAccess();
  const settings = { ...ctxSettings, ...propSettings };
  const location = useLocation();
  const { count } = useCart();
  const [storesOpen, setStoresOpen] = useState(false);

  // Dynamic nav links & stores based on theme_config
  const themeConfig = settings?.theme_config || {};
  const NAV_LINKS = getNavLinks(themeConfig);
  const STORES = getStores(themeConfig);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { key: 'stores', icon: Menu, label: 'القائمة', action: () => setStoresOpen(true) },
    null, // center chat button
    { to: '/cart', icon: ShoppingCart, label: 'السلة', badge: count > 0 ? count : null },
    { to: '/my-account', icon: User, label: 'حسابي' },
  ];

  return (
    <>
      {/* Side Drawer Menu */}
      <AnimatePresence>
        {storesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStoresOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 bg-background z-[70] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-heading font-bold text-base">{settings?.store_name || 'متجري'}</h3>
                  <p className="text-xs opacity-75">القائمة الرئيسية</p>
                </div>
                <button onClick={() => setStoresOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stores Grid */}
              <div className="p-3 border-b border-border/50 shrink-0">
                <p className="text-xs text-muted-foreground font-medium mb-2 px-1">نشاطاتنا</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STORES.map(store => (
                    <Link
                      key={store.key}
                      to={`/store/${store.key}`}
                      onClick={() => setStoresOpen(false)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary hover:bg-accent transition-colors"
                    >
                      <store.icon className="w-6 h-6 text-foreground" />
                      <span className="text-[9px] font-body text-center leading-tight">{store.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto py-2">
                {NAV_LINKS.map(link => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setStoresOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors ${active ? 'text-primary bg-accent font-bold' : 'text-foreground hover:bg-secondary'}`}
                    >
                      <link.icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Dashboard link for active employees and super admins */}
              {isStaff && (
              <div className="p-3 border-t border-border/50 shrink-0">
                <Link
                  to="/admin"
                  onClick={() => setStoresOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  لوحة التحكم
                </Link>
              </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-end justify-around px-2 py-2 max-w-lg mx-auto relative">
          {navItems.map((item, i) => {
            if (!item) {
              // Center chat button
              return (
                <Link
                  key="shop-center"
                  to="/shop"
                  className="relative -mt-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center flex-col"
                  aria-label="المتجر"
                >
                  <LayoutGrid className="w-6 h-6" />
                </Link>
              );
            }
            if (item.action) {
              return (
                <button key={item.key} onClick={item.action} className="flex flex-col items-center gap-0.5 relative px-2 py-1 min-w-[44px]">
                  <div className="relative p-1.5 rounded-xl transition-colors">
                    <item.icon className="w-5 h-5 transition-colors text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-body transition-colors text-muted-foreground">{item.label}</span>
                </button>
              );
            }
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-0.5 relative px-2 py-1 min-w-[44px]">
                <div className={`relative p-1.5 rounded-xl transition-colors ${active ? 'bg-primary/15' : ''}`}>
                  <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold">{item.badge}</span>
                  )}
                </div>
                <span className={`text-[10px] font-body transition-colors ${active ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}