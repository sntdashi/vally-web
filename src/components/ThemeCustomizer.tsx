import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, X, Check, RotateCcw, Settings, Heart, Calendar, User, Users, Save, Loader2 } from "lucide-react";
import { getConfig, saveConfig, type VallyConfig } from "../lib/config";

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

type Tab = 'theme' | 'profile' | 'relationship';

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Theme state
  const [primary, setPrimary] = useState("#3b82f6");
  const [secondary, setSecondary] = useState("#06b6d4");
  const [glassIntensity, setGlassIntensity] = useState(5);

  // Profile/config state
  const [person1Name, setPerson1Name] = useState("You");
  const [person2Name, setPerson2Name] = useState("Vally");
  const [startDate, setStartDate] = useState("2023-06-12");
  const [anniversaryDate, setAnniversaryDate] = useState("06-12");
  const [memoriesCount, setMemoriesCount] = useState("1,240+");
  const [placesVisited, setPlacesVisited] = useState("12");

  // Load saved values
  useEffect(() => {
    const savedPrimary = localStorage.getItem("theme-primary");
    const savedSecondary = localStorage.getItem("theme-secondary");
    const savedGlass = localStorage.getItem("theme-glass");
    if (savedPrimary) setPrimary(savedPrimary);
    if (savedSecondary) setSecondary(savedSecondary);
    if (savedGlass) setGlassIntensity(parseInt(savedGlass));

    const config = getConfig();
    setPerson1Name(config.names.person1);
    setPerson2Name(config.names.person2);
    setStartDate(config.relationship.startDate);
    setAnniversaryDate(config.relationship.anniversaryDate);
    setMemoriesCount(config.stats.memoriesCount);
    setPlacesVisited(config.stats.placesVisited);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--secondary", secondary);
    document.documentElement.style.setProperty("--glass-opacity", (glassIntensity / 100).toString());
    localStorage.setItem("theme-primary", primary);
    localStorage.setItem("theme-secondary", secondary);
    localStorage.setItem("theme-glass", glassIntensity.toString());
  }, [primary, secondary, glassIntensity]);

  const handleSaveConfig = async () => {
    setSaving(true);
    const newConfig: VallyConfig = {
      names: { person1: person1Name, person2: person2Name },
      relationship: { startDate, anniversaryDate },
      stats: { memoriesCount, placesVisited },
    };
    await saveConfig(newConfig);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Reload page to reflect changes everywhere
    setTimeout(() => window.location.reload(), 800);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Names', icon: <Users size={14} /> },
    { id: 'relationship', label: 'Dates', icon: <Calendar size={14} /> },
    { id: 'theme', label: 'Theme', icon: <Palette size={14} /> },
  ];

  return (
    <>
      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed z-[70] w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          right: '16px',
        }}
      >
        <Settings size={20} className="text-white" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-4 z-[90] w-[320px] max-h-[70vh] flex flex-col rounded-3xl border border-white/10 overflow-hidden"
              style={{
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)',
                background: 'rgba(8, 8, 20, 0.97)',
                backdropFilter: 'blur(30px)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                    <Heart size={14} className="text-white fill-white" />
                  </div>
                  <span className="font-bold text-sm">Vally Settings</span>
                </div>
                <button onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 transition-colors opacity-50 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pt-3 pb-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'text-white'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                    style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${primary}33, ${secondary}33)`, border: `1px solid ${primary}44` } : {}}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

                {/* ── PROFILE TAB ── */}
                {activeTab === 'profile' && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">Your Names</p>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1.5">
                        <User size={10} className="inline mr-1" />Your name (Person 1)
                      </label>
                      <input
                        value={person1Name}
                        onChange={e => setPerson1Name(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-romantic-blue/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1.5">
                        <Heart size={10} className="inline mr-1" />Partner's name (Person 2)
                      </label>
                      <input
                        value={person2Name}
                        onChange={e => setPerson2Name(e.target.value)}
                        placeholder="Partner's name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-romantic-blue/50 transition-colors"
                      />
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">Stats</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] opacity-40 block mb-1">Memories</label>
                          <input value={memoriesCount} onChange={e => setMemoriesCount(e.target.value)}
                            placeholder="1,240+" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50" />
                        </div>
                        <div>
                          <label className="text-[10px] opacity-40 block mb-1">Places</label>
                          <input value={placesVisited} onChange={e => setPlacesVisited(e.target.value)}
                            placeholder="12" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── RELATIONSHIP TAB ── */}
                {activeTab === 'relationship' && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">Important Dates</p>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1.5">
                        Start Date (for day counter)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-romantic-blue/50 transition-colors"
                        style={{ colorScheme: 'dark' }}
                      />
                      <p className="text-[10px] opacity-30 mt-1">Tanggal kalian jadian</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1.5">
                        Anniversary Date (MM-DD)
                      </label>
                      <input
                        value={anniversaryDate}
                        onChange={e => setAnniversaryDate(e.target.value)}
                        placeholder="06-12"
                        pattern="\d{2}-\d{2}"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-romantic-blue/50 transition-colors"
                      />
                      <p className="text-[10px] opacity-30 mt-1">Format: MM-DD, contoh: 06-12</p>
                    </div>

                    <div className="glass rounded-2xl p-3 mt-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mb-2">Preview</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: primary }} />
                        <span className="text-xs opacity-60">
                          {person1Name} & {person2Name} · since {startDate || 'your start date'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── THEME TAB ── */}
                {activeTab === 'theme' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mb-3">Presets</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESETS.map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => { setPrimary(preset.primary); setSecondary(preset.secondary); }}
                            className={`p-3 rounded-2xl border transition-all text-left ${
                              primary === preset.primary ? 'border-white/30 bg-white/10' : 'border-white/5 hover:border-white/15 glass'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                              {primary === preset.primary && <Check size={12} className="ml-auto" style={{ color: preset.primary }} />}
                            </div>
                            <span className="text-[10px] opacity-60">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">Custom</p>
                      <div className="flex items-center gap-3">
                        <input type="color" value={primary} onChange={e => setPrimary(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
                        <div>
                          <p className="text-xs font-bold">Primary</p>
                          <p className="text-[10px] opacity-40 font-mono">{primary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
                        <div>
                          <p className="text-xs font-bold">Secondary</p>
                          <p className="text-[10px] opacity-40 font-mono">{secondary}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 mb-2">Glass Intensity: {glassIntensity}</p>
                      <input type="range" min="0" max="20" value={glassIntensity}
                        onChange={e => setGlassIntensity(parseInt(e.target.value))}
                        className="w-full accent-current" style={{ color: primary }} />
                    </div>

                    <button onClick={() => { setPrimary("#3b82f6"); setSecondary("#06b6d4"); setGlassIntensity(5); }}
                      className="flex items-center gap-2 text-xs opacity-40 hover:opacity-80 transition-opacity">
                      <RotateCcw size={12} /> Reset theme
                    </button>
                  </div>
                )}
              </div>

              {/* Save button — shown on profile & relationship tabs */}
              {activeTab !== 'theme' && (
                <div className="px-4 py-3 border-t border-white/5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: saved ? '#10b981' : `linear-gradient(135deg, ${primary}, ${secondary})` }}
                  >
                    {saving ? (
                      <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    ) : saved ? (
                      <><Check size={16} /> Saved! Reloading...</>
                    ) : (
                      <><Save size={16} /> Save Changes</>
                    )}
                  </motion.button>
                  <p className="text-[10px] opacity-30 text-center mt-2">Syncs to Supabase — partner sees changes too</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
