import { motion, AnimatePresence } from "motion/react";
import { Heart, Stars, Calendar, Music, MessageCircleHeart, Moon, Sun, Zap, X, BatteryLow, BatteryFull, Star, Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { usePerformance } from "../hooks/usePerformance";
import NotificationSettings from "./NotificationSettings";
import { PresencePill } from "./PresenceIndicator";
import { usePushNotifications } from "../hooks/usePushNotifications";

function NotificationBell() {
  const { isSubscribed, status, subscribe, unsubscribe } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    if (isSubscribed) await unsubscribe();
    else await subscribe();
    setLoading(false);
  };

  if (status === 'unsupported') return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading || status === 'denied'}
      title={
        status === 'denied' ? 'Notifications blocked — enable in browser settings' :
        isSubscribed ? 'Notif ON — click to disable' :
        'Enable partner notifications'
      }
      className={`p-1.5 rounded-xl hover:bg-white/10 transition-all ${
        isSubscribed ? 'text-green-400' : 'opacity-30 hover:opacity-70'
      }`}
    >
      {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
    </button>
  );
}

interface NavbarProps {
  onThemeToggle: () => void;
  isDark: boolean;
}

export default function Navbar({ onThemeToggle, isDark }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { manualLowPower, toggleLowPowerMode } = usePerformance();

  const navItems = [
    { icon: <Heart size={20} />, label: "Home", href: "#home" },
    { icon: <Calendar size={20} />, label: "Timeline", href: "#timeline" },
    { icon: <Stars size={20} />, label: "Memories", href: "#memories" },
    { icon: <Zap size={20} />, label: "Core", href: "#core" },
    { icon: <Music size={20} />, label: "Playlist", href: "#spotify" },
    { icon: <MessageCircleHeart size={20} />, label: "AI Letter", href: "#ai" },
    { icon: <Star size={20} />, label: "Wishlist", href: "#wishlist" },
  ];

  return (
    <>
      {/* ── TOP BAR ── compact, never overlaps content */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3 md:px-6 md:py-4"
        style={{ background: 'linear-gradient(to bottom, rgba(1,1,3,0.8) 0%, transparent 100%)', backdropFilter: 'blur(0px)' }}
      >
        {/* Logo */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 glass-dark px-3 py-2 rounded-2xl border border-white/10 hover:border-romantic-blue/30 transition-all active:scale-95"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center relative">
            <Heart size={15} className="text-white fill-white" />
            {manualLowPower && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-black flex items-center justify-center">
                <Zap size={6} className="text-black fill-black" />
              </div>
            )}
          </div>
          <span className="font-serif font-bold text-base tracking-tight">ETERNAL</span>
          <span className="text-[10px] font-mono opacity-30 ml-1">☰</span>
        </button>

        {/* Desktop nav items inline */}
        <div className="hidden md:flex items-center gap-1 glass-dark px-3 py-2 rounded-2xl border border-white/10">
          {navItems.map(item => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-sm opacity-60 hover:opacity-100"
            >
              <span className="text-romantic-blue">{item.icon}</span>
              <span className="hidden lg:block font-medium">{item.label}</span>
            </a>
          ))}
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={toggleLowPowerMode} className={`p-1.5 rounded-xl hover:bg-white/10 transition-colors ${manualLowPower ? 'text-yellow-400' : 'opacity-30'}`}>
            {manualLowPower ? <BatteryLow size={18} /> : <BatteryFull size={18} />}
          </button>
          <button onClick={onThemeToggle} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-romantic-cyan opacity-60 hover:opacity-100">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          {/* Notification bell — desktop */}
          <NotificationBell />
        </div>

        {/* Presence pill — top right, desktop only */}
        <div className="hidden md:block">
          <PresencePill />
        </div>
      </motion.nav>

      {/* ── MOBILE BOTTOM SHEET ── slides up from bottom */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[80] md:hidden rounded-t-[2rem] border-t border-white/10 overflow-hidden"
              style={{ background: 'rgba(8, 8, 20, 0.97)', backdropFilter: 'blur(30px)' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Nav grid */}
              <div className="px-4 pt-2 pb-2 grid grid-cols-4 gap-2">
                {navItems.map((item, idx) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    <span className="text-romantic-blue">{item.icon}</span>
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-50">{item.label}</span>
                  </motion.a>
                ))}
              </div>

              {/* Settings row */}
              <div className="mx-4 mb-4 mt-1 p-4 rounded-2xl border border-white/5 flex flex-col gap-4"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Performance */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">Performance</span>
                  <button
                    onClick={toggleLowPowerMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      manualLowPower ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 'glass opacity-50'
                    }`}
                  >
                    {manualLowPower ? <BatteryLow size={14} /> : <BatteryFull size={14} />}
                    {manualLowPower ? 'Low Power' : 'High Quality'}
                  </button>
                </div>

                {/* Notifications */}
                <NotificationSettings />

                {/* Theme */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">Appearance</span>
                  <button
                    onClick={() => { onThemeToggle(); setIsOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold glass opacity-60 hover:opacity-100 transition-all text-romantic-cyan"
                  >
                    {isDark ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
                  </button>
                </div>
              </div>

              {/* Safe area spacer for iOS */}
              <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PRESENCE PILL ── mobile only, bottom center */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[65] pointer-events-none">
        <PresencePill />
      </div>
    </>
  );
}
