import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { Send, Heart, Image, Smile, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePresence } from "../hooks/usePresence";

interface Message {
  id: string;
  content: string;
  author: string;
  author_id: string;
  type: 'text' | 'reaction';
  created_at: string;
}

function getMyName(): string {
  try { return JSON.parse(localStorage.getItem('vally_config') || '{}')?.names?.person1 || 'You'; }
  catch { return 'You'; }
}
function getMyId(): string {
  let id = localStorage.getItem('vally_user_id');
  if (!id) { id = 'user_' + Math.random().toString(36).slice(2); localStorage.setItem('vally_user_id', id); }
  return id;
}

const QUICK_REACTIONS = ['💙', '❤️', '😊', '😘', '🥺', '✨', '🌙', '🫶'];

function timeStr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function dateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const myId = getMyId();
  const myName = getMyName();
  const { partnerOnline, onlineUsers } = usePresence();

  const partner = onlineUsers.find(u => u.userId !== myId);

  useEffect(() => {
    // Fetch initial messages
    supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => setMessages(data || []));

    // Subscribe real-time
    const channel = supabase.channel('chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string, type: 'text' | 'reaction' = 'text') => {
    if (!content.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      id: crypto.randomUUID(),
      content: content.trim(),
      author: myName,
      author_id: myId,
      type,
    });
    setInput('');
    setSending(false);
    inputRef.current?.focus();
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = dateSeparator(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== date) {
      groupedMessages.push({ date, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  });

  return (
    <div className="flex flex-col h-screen pt-16 pb-16 md:pb-0">
      {/* Chat header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center gap-3"
        style={{ background: 'rgba(8,8,20,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center">
            <Heart size={18} className="text-white fill-white" />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080814] ${partnerOnline ? 'bg-green-400' : 'bg-white/20'}`} />
        </div>
        <div>
          <p className="font-bold text-sm">
            {partner?.name || JSON.parse(localStorage.getItem('vally_config') || '{}')?.names?.person2 || 'Your love'}
          </p>
          <p className={`text-[10px] font-mono ${partnerOnline ? 'text-green-400' : 'opacity-30'}`}>
            {partnerOnline ? `Online · ${partner?.page || 'chat'}` : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
            <Heart size={40} className="text-romantic-blue" />
            <p className="text-sm font-serif italic">Say something sweet 💙</p>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="h-px flex-1 bg-white/5" />
              <span className="mx-3 text-[10px] font-mono opacity-30 uppercase tracking-widest">{group.date}</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {group.messages.map((msg, i) => {
              const isMe = msg.author_id === myId;
              const prevMsg = group.messages[i - 1];
              const isSameAuthor = prevMsg?.author_id === msg.author_id;
              const isReaction = msg.type === 'reaction';

              if (isReaction) {
                return (
                  <motion.div key={msg.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-1`}>
                    <span className="text-3xl">{msg.content}</span>
                  </motion.div>
                );
              }

              return (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameAuthor ? 'mt-0.5' : 'mt-3'}`}
                >
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isSameAuthor && !isMe && (
                      <span className="text-[10px] font-mono opacity-30 ml-2">{msg.author}</span>
                    )}
                    <div className={`px-4 py-2.5 rounded-[18px] text-sm leading-relaxed ${
                      isMe
                        ? 'bg-romantic-blue text-white rounded-br-md'
                        : 'bg-white/8 border border-white/10 rounded-bl-md backdrop-blur-sm'
                    }`}
                    style={isMe ? { background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' } : {}}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] font-mono opacity-20 mx-1">{timeStr(msg.created_at)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5"
        style={{ background: 'rgba(8,8,20,0.9)', backdropFilter: 'blur(20px)' }}>

        {/* Quick reactions */}
        <AnimatePresence>
          {showReactions && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mb-3 flex-wrap">
              {QUICK_REACTIONS.map(r => (
                <button key={r} onClick={() => { sendMessage(r, 'reaction'); setShowReactions(false); }}
                  className="text-2xl hover:scale-125 active:scale-95 transition-transform">
                  {r}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowReactions(!showReactions)}
            className={`p-2.5 rounded-2xl transition-all ${showReactions ? 'bg-romantic-blue/20 text-romantic-blue' : 'glass hover:bg-white/10 opacity-60 hover:opacity-100'}`}>
            <Smile size={20} />
          </button>

          <div className="flex-1 flex items-center gap-2 glass rounded-2xl px-4 py-2.5 border border-white/10">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Say something sweet..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-30"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-2xl transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
          >
            <Send size={18} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
