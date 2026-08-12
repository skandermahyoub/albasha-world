import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Menu, Moon, Sun, X, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getNavLinks, getStores } from '@/lib/navLinks';
import { useStoreSettings } from '@/lib/useStoreSettings';
import { useAuth } from '@/lib/AuthContext';
import useStaffAccess from '@/lib/useStaffAccess';
import NotificationBell from '@/components/NotificationBell';
export default function StickyHeader({ visible, cartCount, isDark, toggleTheme, settings: propSettings }) {
  const { settings: ctxSettings } = useStoreSettings();
  const { user } = useAuth();
  const { isStaff } = useStaffAccess();
  const settings = { ...ctxSettings, ...propSettings };
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Dynamic nav links & stores based on theme_config
  const themeConfig = settings?.theme_config || {};
  const NAV_LINKS = getNavLinks(themeConfig);
  const STORES = getStores(themeConfig);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.header
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            exit={{ y: -80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} className="text-foreground">
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  {settings?.logo_url && (
                    <img src={settings.logo_url} alt={settings?.store_name || 'متجري'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading font-bold text-sm md:text-base leading-tight truncate max-w-[125px] sm:max-w-[220px]">{settings?.store_name || 'متجري'}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight hidden md:block truncate max-w-[260px]">{settings?.slogan || ''}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <NotificationBell />
                <Link to="/favorites">
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <Heart className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <ShoppingCart className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Side Drawer Menu — same design as BottomNav */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
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
                <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
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
                      onClick={() => setMenuOpen(false)}
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
                      onClick={() => setMenuOpen(false)}
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
                  onClick={() => setMenuOpen(false)}
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
    </>
  );
}