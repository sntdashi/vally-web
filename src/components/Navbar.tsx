import { motion, AnimatePresence } from "motion/react";
import { Heart, Stars, Calendar, Music, MessageCircleHeart, Moon, Sun, Zap, Menu, X, BatteryLow, BatteryFull } from "lucide-react";
import { useState } from "react";
import { usePerformance } from "../hooks/usePerformance";
import NotificationSettings from "./NotificationSettings";

interface NavbarProps {
  onThemeToggle: () => void;
  isDark: boolean;
}

export default function Navbar({ onThemeToggle, isDark }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { manualLowPower, toggleLowPowerMode } = usePerformance();

  const navItems = [
    { icon: <Heart size={18} />, label: "Home", href: "#home" },
    { icon: <Calendar size={18} />, label: "Timeline", href: "#timeline" },
    { icon: <Stars size={18} />, label: "Memories", href: "#memories" },
    { icon: <Zap size={18} />, label: "Core", href: "#core" },
    { icon: <Music size={18} />, label: "Playlist", href: "#spotify" },
    { icon: <MessageCircleHeart size={18} />, label: "AI Letter", href: "#ai" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-4 left-0 right-0 md:left-6 md:right-auto md:top-6 z-50 flex justify-center md:justify-start px-4 md:px-0"
    >
      <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-md md:max-w-none">
        {/* Main Bar */}
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          {/* Logo / Trigger */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="glass-dark p-2 md:p-3 rounded-2xl flex items-center justify-between md:justify-start gap-2 md:gap-3 border border-white/10 shadow-2xl hover:scale-105 active:scale-95 transition-transform z-50 w-full md:w-auto"
            whileHover={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" }}
          >
            <div className="flex items-center gap-2 md:gap-3 relative">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center shadow-lg relative">
                <Heart size={18} className="text-white fill-white md:w-5 md:h-5" />
                {manualLowPower && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-[#010103] flex items-center justify-center"
                  >
                    <Zap size={8} className="text-black fill-black" />
                  </motion.div>
                )}
              </div>
              <span className="font-serif font-bold text-lg md:text-xl tracking-tighter">ETERNAL</span>
            </div>
            
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="opacity-40"
            >
              {isOpen ? <X size={16} className="md:w-[18px] md:h-[18px]" /> : <Menu size={16} className="md:w-[18px] md:h-[18px]" />}
            </motion.div>
          </motion.button>

          {/* Desktop Navigation Panel (Horizontal) */}
          <div className="hidden md:block">
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ x: -20, opacity: 0, scale: 0.95 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: -20, opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="glass-dark p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2"
                >
                  <div className="flex items-center px-2 gap-2">
                    {navItems.map((item, idx) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium whitespace-nowrap group"
                      >
                        <span className="text-romantic-blue group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <span className="hidden lg:block opacity-60 group-hover:opacity-100 transition-opacity">
                          {item.label}
                        </span>
                      </motion.a>
                    ))}
                  </div>

                  <div className="h-8 w-[1px] bg-white/10 mx-1 shrink-0" />

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={toggleLowPowerMode}
                    className={`p-3 rounded-xl hover:bg-white/5 transition-colors shrink-0 ${manualLowPower ? 'text-yellow-400' : 'text-white/40'}`}
                    aria-label="Toggle low power mode"
                    title={manualLowPower ? "Disable Low Power Mode" : "Enable Low Power Mode"}
                  >
                    {manualLowPower ? <BatteryLow size={20} /> : <BatteryFull size={20} />}
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onThemeToggle}
                    className="p-3 rounded-xl hover:bg-white/5 transition-colors text-romantic-cyan shrink-0"
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Navigation Panel (Vertical/Grid) */}
        <div className="md:hidden w-full">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ y: -10, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -10, opacity: 0, scale: 0.95 }}
                className="glass-dark p-4 rounded-3xl border border-white/10 shadow-2xl mt-2 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item, idx) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <span className="text-romantic-blue">
                        {item.icon}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                        {item.label}
                      </span>
                    </motion.a>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Performance</span>
                    <button
                      onClick={toggleLowPowerMode}
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${manualLowPower ? 'text-yellow-400' : 'text-white/40'}`}
                    >
                      {manualLowPower ? (
                        <>
                          <BatteryLow size={16} />
                          <span className="text-xs font-bold">Low Power On</span>
                        </>
                      ) : (
                        <>
                          <BatteryFull size={16} />
                          <span className="text-xs font-bold">High Quality</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Notification toggle */}
                  <div className="pt-2 border-t border-white/5">
                    <NotificationSettings />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Appearance</span>
                    <button
                      onClick={onThemeToggle}
                      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-romantic-cyan"
                    >
                      {isDark ? (
                        <>
                          <Sun size={16} />
                          <span className="text-xs font-bold">Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon size={16} />
                          <span className="text-xs font-bold">Dark Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
