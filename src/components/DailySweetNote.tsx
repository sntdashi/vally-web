import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Quote, Sparkles, RefreshCw } from "lucide-react";
import { generateDailyNote } from "../lib/gemini";
import GlassCard from "./GlassCard";

export default function DailySweetNote() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchNote = async () => {
    setLoading(true);
    const result = await generateDailyNote();
    setNote(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchNote();
  }, []);

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 md:mb-6"
        >
          <Sparkles size={16} className="text-romantic-cyan" />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Daily Inspiration</span>
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Today's Sweet Note</h2>
      </div>

      <GlassCard className="relative overflow-hidden min-h-[200px] flex items-center justify-center p-6 md:p-8">
        <div className="absolute top-4 left-4 md:top-6 md:left-6 opacity-10">
          <Quote size={48} className="text-romantic-blue md:w-16 md:h-16" />
        </div>
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <RefreshCw className="animate-spin text-romantic-blue" size={32} />
              <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-40">Consulting the stars...</p>
            </motion.div>
          ) : (
            <motion.div
              key="note"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 text-center px-4 md:px-8 py-8"
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-serif italic leading-relaxed text-gradient">
                {note}
              </p>
              <button 
                onClick={fetchNote}
                className="mt-6 md:mt-8 p-2 rounded-full hover:bg-white/5 transition-colors opacity-20 hover:opacity-100"
                title="Get another note"
              >
                <RefreshCw size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 opacity-10 rotate-180">
          <Quote size={48} className="text-romantic-blue md:w-16 md:h-16" />
        </div>
      </GlassCard>
    </section>
  );
}
