import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Send, Sparkles, Loader2, Type, Eye, Wand2 } from "lucide-react";
import { generateLoveLetter } from "../lib/gemini";
import GlassCard from "./GlassCard";

type EffectType = "typewriter" | "fade" | "shimmer";

export default function AILoveLetter() {
  const [prompt, setPrompt] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState<EffectType>("typewriter");
  const [displayLetter, setDisplayLetter] = useState("");

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLetter("");
    setDisplayLetter("");
    const result = await generateLoveLetter(prompt);
    setLetter(result);
    setLoading(false);
  };

  useEffect(() => {
    if (letter && effect === "typewriter") {
      let i = 0;
      setDisplayLetter("");
      const interval = setInterval(() => {
        setDisplayLetter((prev) => prev + letter[i]);
        i++;
        if (i >= letter.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    } else {
      setDisplayLetter(letter);
    }
  }, [letter, effect]);

  const effects: { id: EffectType; icon: any; label: string }[] = [
    { id: "typewriter", icon: <Type size={16} />, label: "Typewriter" },
    { id: "fade", icon: <Eye size={16} />, label: "Fade In" },
    { id: "shimmer", icon: <Wand2 size={16} />, label: "Shimmer" },
  ];

  return (
    <section id="ai" className="py-16 md:py-24 px-4 md:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 md:mb-6"
        >
          <Sparkles size={16} className="text-romantic-blue" />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Neural Love Engine</span>
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4 md:mb-6">AI Love Letter</h2>
        <p className="opacity-60 max-w-xl mx-auto text-sm md:text-base">
          Tell the AI a memory or a feeling, and let it craft a masterpiece for you.
        </p>
      </div>

      <GlassCard className="relative overflow-hidden p-6 md:p-8">
        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-40">Select Effect:</span>
            <div className="flex flex-wrap gap-2">
              {effects.map((eff) => (
                <button
                  key={eff.id}
                  onClick={() => setEffect(eff.id)}
                  className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                    effect === eff.id
                      ? "bg-romantic-blue text-white shadow-lg shadow-romantic-blue/20"
                      : "bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  {eff.icon}
                  {eff.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Our first date at the beach, or how you feel when you see her smile..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 min-h-[120px] focus:outline-none focus:border-romantic-blue/50 transition-colors resize-none text-base md:text-lg pb-16"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="absolute bottom-4 right-4 bg-romantic-blue hover:bg-romantic-blue/80 disabled:opacity-50 text-white p-2 md:p-3 rounded-xl transition-all shadow-lg shadow-romantic-blue/20"
            >
              {loading ? <Loader2 className="animate-spin md:w-5 md:h-5 w-4 h-4" /> : <Send className="md:w-5 md:h-5 w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {letter && (
              <motion.div
                key={letter + effect}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 italic font-serif text-lg md:text-2xl leading-relaxed opacity-90 relative overflow-hidden"
              >
                <div className="absolute top-2 left-2 md:top-4 md:left-4 text-romantic-blue/20 text-4xl md:text-6xl">"</div>
                
                <div className={`relative z-10 ${effect === "shimmer" ? "animate-shimmer-text" : ""}`}>
                  {effect === "typewriter" ? displayLetter : letter}
                  {effect === "typewriter" && displayLetter.length < letter.length && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-1 h-5 md:h-6 bg-romantic-blue ml-1 align-middle"
                    />
                  )}
                </div>

                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-romantic-blue/20 text-4xl md:text-6xl rotate-180">"</div>
                
                {effect === "shimmer" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </section>
  );
}
