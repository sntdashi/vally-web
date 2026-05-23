import { Suspense, lazy, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Sparkles, ShieldCheck, Globe, Zap, Heart, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import GlassCard from "../components/GlassCard";
import { usePerformance } from "../hooks/usePerformance";
import { usePresence } from "../hooks/usePresence";

const Hero3D = lazy(() => import("../components/Hero3D"));
const StatsDashboard = lazy(() => import("../components/StatsDashboard"));
const AnniversaryCountdown = lazy(() => import("../components/AnniversaryCountdown"));
const DailySweetNote = lazy(() => import("../components/DailySweetNote"));

const DocumentationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="glass-dark max-w-2xl w-full p-8 rounded-[2rem] border border-white/10 relative"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-3xl font-serif font-bold mb-6">System Documentation v4.0</h2>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          <section>
            <h4 className="text-romantic-blue font-mono text-xs uppercase tracking-widest mb-2">01. Core Architecture</h4>
            <p className="opacity-60 text-sm leading-relaxed">Built on a foundation of mutual trust, shared laughter, and high-availability emotional support. The backend is powered by 100% organic devotion.</p>
          </section>
          <section>
            <h4 className="text-romantic-cyan font-mono text-xs uppercase tracking-widest mb-2">02. Security Protocols</h4>
            <p className="opacity-60 text-sm leading-relaxed">End-to-end loyalty encryption enabled by default. Unauthorized heartbreak is automatically blocked by the firewall of shared memories.</p>
          </section>
          <section>
            <h4 className="text-romantic-blue font-mono text-xs uppercase tracking-widest mb-2">03. Maintenance Schedule</h4>
            <p className="opacity-60 text-sm leading-relaxed">Daily updates: 1x Morning Coffee, 5x Random Hugs, infinite "I Love You" pings. Emergency patches deployed immediately upon "Bad Day" signal.</p>
          </section>
          <section>
            <h4 className="text-romantic-cyan font-mono text-xs uppercase tracking-widest mb-2">04. Scalability</h4>
            <p className="opacity-60 text-sm leading-relaxed">Designed to scale across decades. New modules (Travel, Home, Future) integrate seamlessly without downtime.</p>
          </section>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] font-mono opacity-30 uppercase">Status: Fully Operational</span>
          <button onClick={onClose} className="px-6 py-2 rounded-full bg-romantic-blue text-white text-sm font-bold">Acknowledge</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function HomePage() {
  const [showDocs, setShowDocs] = useState(false);
  const containerRef = useRef(null);
  const { isMobile, disable3D } = usePerformance();
  const { updatePage } = usePresence();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  useEffect(() => { updatePage('home'); }, []);

  return (
    <div ref={containerRef}>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-transparent" />}>
          {!isMobile && !disable3D && <Hero3D />}
        </Suspense>
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass mb-8 border-romantic-cyan/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <Sparkles size={18} className="text-romantic-cyan animate-pulse" />
            <span className="text-xs font-bold tracking-[0.4em] uppercase opacity-90">Next-Gen Love Experience v4.0</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 50, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.5, delay: 0.7 }}
            className="text-5xl sm:text-7xl md:text-[10rem] font-serif font-bold leading-none mb-8 tracking-tighter">
            <span className="block">Eternal</span>
            <span className="text-gradient drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]">Devotion</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 1.2 }}
            className="text-base sm:text-lg md:text-2xl opacity-60 font-light max-w-3xl mx-auto mb-12 leading-relaxed">
            A private digital sanctuary engineered with quantum-grade affection.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-romantic-blue text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              Explore Our World
            </button>
            <button onClick={() => setShowDocs(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass font-bold text-lg hover:bg-white/10 transition-all">
              View Documentation
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard delay={0.1}>
            <Zap className="text-romantic-blue mb-6" size={32} />
            <h3 className="text-xl font-bold mb-4">Ultra-Fast Connection</h3>
            <p className="opacity-50 leading-relaxed">Built on low-latency, high-bandwidth emotional infrastructure that never fails.</p>
          </GlassCard>
          <GlassCard delay={0.2}>
            <ShieldCheck className="text-romantic-cyan mb-6" size={32} />
            <h3 className="text-xl font-bold mb-4">End-to-End Security</h3>
            <p className="opacity-50 leading-relaxed">Your heart is protected by the most advanced encryption protocols known to mankind.</p>
          </GlassCard>
          <GlassCard delay={0.3}>
            <Globe className="text-blue-400 mb-6" size={32} />
            <h3 className="text-xl font-bold mb-4">Global Scalability</h3>
            <p className="opacity-50 leading-relaxed">Our love scales horizontally across every continent and time zone.</p>
          </GlassCard>
        </div>
      </section>

      <Suspense fallback={<div className="h-48 opacity-20" />}>
        <div id="stats"><StatsDashboard /></div>
      </Suspense>
      <Suspense fallback={null}><AnniversaryCountdown /></Suspense>
      <Suspense fallback={null}><DailySweetNote /></Suspense>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 text-center">
        <div className="mb-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center mx-auto mb-6">
            <Heart size={32} className="text-white fill-white" />
          </div>
          <h2 className="text-3xl font-serif font-bold italic">Always & Forever</h2>
          <p className="opacity-40 mt-4 font-mono text-sm uppercase tracking-widest">Built with love and precision</p>
        </div>
        <div className="flex items-center justify-center gap-8 opacity-20 text-xs font-mono uppercase tracking-widest">
          <span>© 2026 Eternal Inc.</span>
          <span>Privacy Policy</span>
          <span>Terms of Devotion</span>
        </div>
      </footer>

      <AnimatePresence>
        <DocumentationModal isOpen={showDocs} onClose={() => setShowDocs(false)} />
      </AnimatePresence>
    </div>
  );
}
