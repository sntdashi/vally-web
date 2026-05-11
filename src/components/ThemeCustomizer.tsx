import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, X, Check, RotateCcw, Sliders } from "lucide-react";

interface ThemePreset {
  name: string;
  primary: string;
  secondary: string;
}

const PRESETS: ThemePreset[] = [
  { name: "Classic Blue", primary: "#3b82f6", secondary: "#06b6d4" },
  { name: "Rose Garden", primary: "#ec4899", secondary: "#f43f5e" },
  { name: "Emerald Dream", primary: "#10b981", secondary: "#34d399" },
  { name: "Midnight Purple", primary: "#8b5cf6", secondary: "#d946ef" },
  { name: "Sunset Gold", primary: "#f59e0b", secondary: "#fbbf24" },
];

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [primary, setPrimary] = useState("#3b82f6");
  const [secondary, setSecondary] = useState("#06b6d4");
  const [glassIntensity, setGlassIntensity] = useState(5); // 0-10

  useEffect(() => {
    const savedPrimary = localStorage.getItem("theme-primary");
    const savedSecondary = localStorage.getItem("theme-secondary");
    const savedGlass = localStorage.getItem("theme-glass");

    if (savedPrimary) setPrimary(savedPrimary);
    if (savedSecondary) setSecondary(savedSecondary);
    if (savedGlass) setGlassIntensity(parseInt(savedGlass));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--secondary", secondary);
    document.documentElement.style.setProperty("--glass-opacity", (glassIntensity / 100).toString());
    
    localStorage.setItem("theme-primary", primary);
    localStorage.setItem("theme-secondary", secondary);
    localStorage.setItem("theme-glass", glassIntensity.toString());
  }, [primary, secondary, glassIntensity]);

  const resetTheme = () => {
    setPrimary("#3b82f6");
    setSecondary("#06b6d4");
    setGlassIntensity(5);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-40 p-4 rounded-full glass-dark text-romantic-cyan hover:scale-110 transition-transform shadow-2xl border border-white/10"
        title="Customize Theme"
      >
        <Palette size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-dark w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 relative shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-romantic-blue/20 text-romantic-blue">
                  <Palette size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold">Aesthetic Engine</h2>
                  <p className="text-xs opacity-50 font-mono uppercase tracking-widest">Theme Customization v1.0</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Presets */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-4">Presets</label>
                  <div className="grid grid-cols-5 gap-3">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setPrimary(preset.primary);
                          setSecondary(preset.secondary);
                        }}
                        className={`group relative h-12 rounded-xl overflow-hidden border-2 transition-all ${
                          primary === preset.primary ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        title={preset.name}
                      >
                        <div className="absolute inset-0 flex">
                          <div style={{ backgroundColor: preset.primary }} className="w-1/2 h-full" />
                          <div style={{ backgroundColor: preset.secondary }} className="w-1/2 h-full" />
                        </div>
                        {primary === preset.primary && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-3">Primary</label>
                    <div className="flex items-center gap-3 glass p-2 rounded-2xl border-white/5">
                      <input
                        type="color"
                        value={primary}
                        onChange={(e) => setPrimary(e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border-none"
                      />
                      <span className="text-xs font-mono opacity-60 uppercase">{primary}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-3">Secondary</label>
                    <div className="flex items-center gap-3 glass p-2 rounded-2xl border-white/5">
                      <input
                        type="color"
                        value={secondary}
                        onChange={(e) => setSecondary(e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border-none"
                      />
                      <span className="text-xs font-mono opacity-60 uppercase">{secondary}</span>
                    </div>
                  </div>
                </div>

                {/* Glass Intensity */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-mono uppercase tracking-widest opacity-40">Glass Intensity</label>
                    <span className="text-xs font-mono opacity-60">{glassIntensity * 10}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Sliders size={16} className="opacity-30" />
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={glassIntensity}
                      onChange={(e) => setGlassIntensity(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-romantic-blue"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={resetTheme}
                    className="flex-1 py-3 rounded-2xl glass border-white/5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Reset to Default
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-romantic-blue text-white text-sm font-bold shadow-lg shadow-romantic-blue/20 hover:scale-[1.02] transition-transform"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
