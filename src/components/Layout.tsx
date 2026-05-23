import { Suspense, lazy, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Calendar, Image, Disc3, Mail, Star, MessageCircle, Settings, Moon, Sun, BatteryLow, BatteryFull, Bell, BellOff, X, Menu } from "lucide-react";
import { usePerformance } from "../hooks/usePerformance";
import { PresencePill } from "./PresenceIndicator";
import NotificationSettings from "./NotificationSettings";
import { usePushNotifications } from "../hooks/usePushNotifications";

const GlobalBackground = lazy(() => import("./GlobalBackground"));
const MusicPlayer = lazy(() => import("./MusicPlayer"));
const PresenceIndicator = lazy(() => import("./PresenceIndicator"));
const PWAInstallPrompt = lazy(() => import("./PWAInstallPrompt"));
const ThemeCustomizer = lazy(() => import("./ThemeCustomizer"));

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Heart },
  { path: '/timeline', label: 'Timeline', icon: Calendar },
  { path: '/memories', label: 'Memories', icon: Image },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/wishlist', label: 'Wishlist', icon: Star },
];

const MORE_ITEMS = [
  { path: '/letters', label: 'AI Letter', icon: Mail },
  { path: '/playlist', label: 'Playlist', icon: Disc3 },
  { path: '/core', label: 'Moon Core', icon: Star },
];

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden"
      style={{ background: 'rgba(4,5,15,0.95)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-around px-2 py-2" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <NavLink key={item.path} to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all relative">
              {isActive && (
                <motion.div layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'rgba(59,130,246,0.15)' }} />
              )}
              <Icon size={22} className={`relative z-10 transition-colors ${isActive ? 'text-romantic-blue' : 'opacity-40'}`}
                fill={isActive ? 'currentColor' : 'none'} />
              <span className={`text-[9px] font-mono uppercase tracking-wider relative z-10 ${isActive ? 'text-romantic-blue' : 'opacity-30'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar({ isDark, onThemeToggle }: { isDark: boolean; onThemeToggle: () => void }) {
  const location = useLocation();
  const { manualLowPower, toggleLowPowerMode } = usePerformance();
  const { isSubscribed, status, subscribe, unsubscribe } = usePushNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const allItems = [...NAV_ITEMS, ...MORE_ITEMS];
  const currentPage = allItems.find(i => i.path === '/' ? location.pathname === '/' : location.pathname.startsWith(i.path));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 md:px-6"
        style={{ background: 'linear-gradient(to bottom, rgba(4,5,15,0.9), transparent)', backdropFilter: 'blur(0px)' }}>
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <Heart size={16} className="text-white fill-white" />
          </div>
          <span className="font-serif font-bold text-base hidden sm:block">ETERNAL</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 glass-dark px-3 py-2 rounded-2xl border border-white/10">
          {[...NAV_ITEMS, ...MORE_ITEMS].map(item => {
            const Icon = item.icon;
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <NavLink key={item.path} to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive ? 'bg-romantic-blue/20 text-romantic-blue' : 'opacity-50 hover:opacity-100 hover:bg-white/10'
                }`}>
                <Icon size={14} />
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={toggleLowPowerMode} className={`p-1.5 rounded-xl hover:bg-white/10 transition-colors ${manualLowPower ? 'text-yellow-400' : 'opacity-30'}`}>
            {manualLowPower ? <BatteryLow size={16} /> : <BatteryFull size={16} />}
          </button>
          <button onClick={onThemeToggle} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors opacity-60 hover:opacity-100 text-romantic-cyan">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => isSubscribed ? unsubscribe() : subscribe()}
            disabled={status === 'denied'}
            className={`p-1.5 rounded-xl hover:bg-white/10 transition-colors ${isSubscribed ? 'text-green-400' : 'opacity-30'}`}>
            {isSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block"><PresencePill /></div>
          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 glass rounded-xl border border-white/10">
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Mobile slide-up menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm md:hidden" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[80] md:hidden rounded-t-[2rem] border-t border-white/10"
              style={{ background: 'rgba(8,8,20,0.98)', backdropFilter: 'blur(30px)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* More nav items */}
              <div className="px-4 pt-2 pb-2 grid grid-cols-3 gap-2">
                {MORE_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.path} to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/20 transition-colors">
                      <Icon size={20} className="text-romantic-blue" />
                      <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="mx-4 mb-4 mt-1 p-4 rounded-2xl border border-white/5 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">Performance</span>
                  <button onClick={toggleLowPowerMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${manualLowPower ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 'glass opacity-50'}`}>
                    {manualLowPower ? <><BatteryLow size={14} /> Low Power</> : <><BatteryFull size={14} /> High Quality</>}
                  </button>
                </div>
                <NotificationSettings />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">Appearance</span>
                  <button onClick={() => { onThemeToggle(); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold glass opacity-60 hover:opacity-100 transition-all text-romantic-cyan">
                    {isDark ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
                  </button>
                </div>
              </div>

              <div className="flex justify-center pb-2 mb-4">
                <PresencePill />
              </div>

              <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Layout({ children, isDark, onThemeToggle }: {
  children: React.ReactNode;
  isDark: boolean;
  onThemeToggle: () => void;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Suspense fallback={<div className="fixed inset-0 bg-[#010103]" />}>
        <GlobalBackground />
      </Suspense>

      <TopBar isDark={isDark} onThemeToggle={onThemeToggle} />

      <Suspense fallback={null}><MusicPlayer /></Suspense>
      <Suspense fallback={null}>
        <PresenceIndicator />
      </Suspense>
      <Suspense fallback={null}><PWAInstallPrompt /></Suspense>
      <Suspense fallback={null}><ThemeCustomizer /></Suspense>

      {/* Main content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
