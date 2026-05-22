import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Send, Sparkles, Loader2, Type, Eye, Wand2, Clock, Trash2, ChevronDown, ChevronUp, Heart } from "lucide-react";
import { generateLoveLetter } from "../lib/gemini";
import GlassCard from "./GlassCard";
import { supabase } from "../lib/supabase";

type EffectType = "typewriter" | "fade" | "shimmer";

interface LetterRecord {
  id: string;
  prompt: string;
  letter: string;
  author: string;
  created_at: string;
}

function getMyName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person1 || 'You';
  } catch { return 'You'; }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AILoveLetter() {
  const [prompt, setPrompt] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState<EffectType>("typewriter");
  const [displayLetter, setDisplayLetter] = useState("");
  const [history, setHistory] = useState<LetterRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('love_letters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  useEffect(() => {
    fetchHistory();
    const channel = supabase.channel('love-letters-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'love_letters' }, fetchHistory)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLetter("");
    setDisplayLetter("");
    const result = await generateLoveLetter(prompt);
    setLetter(result);
    setLoading(false);

    // Save to Supabase
    await supabase.from('love_letters').insert({
      id: crypto.randomUUID(),
      prompt,
      letter: result,
      author: getMyName(),
    });
    fetchHistory();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('love_letters').delete().eq('id', id);
    setHistory(prev => prev.filter(l => l.id !== id));
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
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 md:mb-6">
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
          {/* Effect selector */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-40">Select Effect:</span>
            <div className="flex flex-wrap gap-2">
              {effects.map((eff) => (
                <button key={eff.id} onClick={() => setEffect(eff.id)}
                  className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                    effect === eff.id
                      ? "bg-romantic-blue text-white shadow-lg shadow-romantic-blue/20"
                      : "bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100"
                  }`}>
                  {eff.icon} {eff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
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

          {/* Generated letter */}
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
                {/* Saved indicator */}
                <div className="mt-4 flex items-center gap-2 text-[10px] font-mono opacity-30 not-italic">
                  <Heart size={10} className="fill-current" />
                  Saved to your letter archive
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* History section */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-4 glass rounded-2xl hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-romantic-blue opacity-60" />
              <span className="text-sm font-bold">Letter Archive</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-romantic-blue/20 text-romantic-blue">
                {history.length}
              </span>
            </div>
            {showHistory ? <ChevronUp size={16} className="opacity-40" /> : <ChevronDown size={16} className="opacity-40" />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 mt-3">
                  {history.map(record => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass rounded-2xl overflow-hidden"
                    >
                      {/* Header */}
                      <button
                        onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                        className="w-full flex items-start justify-between p-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate opacity-80">"{record.prompt}"</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono opacity-30">{timeAgo(record.created_at)}</span>
                            <span className="text-[10px] font-mono opacity-30">·</span>
                            <span className="text-[10px] font-mono opacity-30">by {record.author}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(record.id); }}
                            className="p-1.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all opacity-30 hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                          {expandedId === record.id
                            ? <ChevronUp size={14} className="opacity-40" />
                            : <ChevronDown size={14} className="opacity-40" />}
                        </div>
                      </button>

                      {/* Expanded letter */}
                      <AnimatePresence>
                        {expandedId === record.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 border-t border-white/5">
                              <p className="font-serif italic text-sm md:text-base leading-relaxed opacity-70">
                                {record.letter}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
