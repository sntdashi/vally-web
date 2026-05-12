import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Quote, Sparkles, RefreshCw, Send, Heart } from "lucide-react";
import { generateDailyNote } from "../lib/gemini";
import GlassCard from "./GlassCard";
import { supabase } from "../lib/supabase";

interface SweetNote {
  id: string;
  note: string;
  author: string;
  created_at: string;
}

function getMyName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person1 || 'You';
  } catch { return 'You'; }
}

function getPartnerName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person2 || 'Your love';
  } catch { return 'Your love'; }
}

async function fetchTodayNote(): Promise<SweetNote | null> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data } = await supabase
    .from('sweet_notes')
    .select('*')
    .gte('created_at', today + 'T00:00:00')
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

async function saveNote(note: string, author: string): Promise<SweetNote | null> {
  const { data, error } = await supabase
    .from('sweet_notes')
    .insert({ id: crypto.randomUUID(), note, author })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return data;
}

export default function DailySweetNote() {
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(true);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const loadNote = async () => {
    setLoading(true);
    // First try to get today's note from Supabase
    const existing = await fetchTodayNote();
    if (existing) {
      setNote(existing.note);
      setAuthor(existing.author);
      setLoading(false);
      return;
    }
    // Otherwise generate with AI
    const aiNote = await generateDailyNote();
    setNote(aiNote);
    setAuthor('AI');
    // Auto-save AI note to Supabase so partner sees the same one
    await saveNote(aiNote, 'AI');
    setLoading(false);
  };

  const refreshNote = async () => {
    setLoading(true);
    const aiNote = await generateDailyNote();
    setNote(aiNote);
    setAuthor('AI');
    await saveNote(aiNote, 'AI');
    setLoading(false);
  };

  const sendCustomNote = async () => {
    if (!customText.trim()) return;
    setSending(true);
    const saved = await saveNote(customText.trim(), getMyName());
    if (saved) {
      setNote(saved.note);
      setAuthor(saved.author);
      setCustomMode(false);
      setCustomText("");
      setJustSent(true);
      setTimeout(() => setJustSent(false), 3000);
    }
    setSending(false);
  };

  useEffect(() => {
    loadNote();

    // Real-time: if partner sends a note, update instantly
    const channel = supabase
      .channel('sweet-notes-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sweet_notes' }, (payload) => {
        const newNote = payload.new as SweetNote;
        if (newNote.author !== 'AI') {
          setNote(newNote.note);
          setAuthor(newNote.author);
          setJustSent(true);
          setTimeout(() => setJustSent(false), 3000);
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const isFromPartner = author !== 'AI' && author !== getMyName();

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 md:mb-6"
        >
          <Sparkles size={16} className="text-romantic-cyan" />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Daily Sweet Note</span>
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Today's Message</h2>
        <p className="opacity-50 text-sm">Shared between you two — updates in real-time 💙</p>
      </div>

      <GlassCard className="relative overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-6 md:p-8">
        <div className="absolute top-4 left-4 md:top-6 md:left-6 opacity-10">
          <Quote size={48} className="text-romantic-blue md:w-16 md:h-16" />
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin text-romantic-blue" size={32} />
              <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest opacity-40">Consulting the stars...</p>
            </motion.div>
          ) : customMode ? (
            <motion.div key="custom" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center gap-4 py-4">
              <p className="text-xs font-mono uppercase tracking-widest opacity-50">Write a note for {getPartnerName()}</p>
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder="Something sweet..."
                maxLength={200}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base font-serif italic resize-none outline-none focus:border-romantic-blue/50 transition-colors placeholder:opacity-30"
              />
              <div className="flex gap-3">
                <button onClick={() => setCustomMode(false)}
                  className="px-5 py-2 rounded-full glass text-sm opacity-60 hover:opacity-100 transition-all">
                  Cancel
                </button>
                <button onClick={sendCustomNote} disabled={sending || !customText.trim()}
                  className="px-6 py-2 rounded-full bg-romantic-blue text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:scale-105 transition-all">
                  {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Send
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="note" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="relative z-10 text-center px-4 md:px-8 py-6 w-full">
              {/* Author badge */}
              {author && author !== 'AI' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass mb-4 text-[10px] font-mono uppercase tracking-widest">
                  <Heart size={10} className={`fill-current ${isFromPartner ? 'text-romantic-cyan' : 'text-romantic-blue'}`} />
                  {isFromPartner ? `From ${author}` : 'From you'}
                </motion.div>
              )}

              <p className="text-xl sm:text-2xl md:text-3xl font-serif italic leading-relaxed text-gradient">
                {note}
              </p>

              {/* Just received toast */}
              <AnimatePresence>
                {justSent && (
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-4 text-xs text-romantic-cyan font-mono">
                    {isFromPartner ? `${author} just sent this 💙` : 'Sent to your love 💙'}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setCustomMode(true)}
                  className="px-5 py-2 rounded-full glass text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                  <Heart size={12} /> Write one
                </button>
                <button onClick={refreshNote}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors opacity-30 hover:opacity-80" title="Generate new AI note">
                  <RefreshCw size={16} />
                </button>
              </div>
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
