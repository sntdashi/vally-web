import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { Send, Heart, Smile, X, Image as ImageIcon, Video, FileText, Paperclip, Play, Download, File, CheckCheck, Loader2, ZoomIn } from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePresence } from "../hooks/usePresence";

interface Message {
  id: string;
  content: string;
  author: string;
  author_id: string;
  type: 'text' | 'reaction' | 'media';
  media_url?: string;
  media_type?: 'image' | 'video' | 'document';
  media_name?: string;
  media_size?: number;
  storage_path?: string;
  created_at: string;
}

interface UploadingMedia {
  id: string;
  name: string;
  progress: number;
  type: 'image' | 'video' | 'document';
  previewUrl?: string;
}

function getMyName(): string {
  try { return JSON.parse(localStorage.getItem('vally_config') || '{}')?.names?.person1 || 'You'; }
  catch { return 'You'; }
}
function getPartnerName(): string {
  try { return JSON.parse(localStorage.getItem('vally_config') || '{}')?.names?.person2 || 'Your love'; }
  catch { return 'Your love'; }
}
function getMyId(): string {
  let id = localStorage.getItem('vally_user_id');
  if (!id) { id = 'user_' + Math.random().toString(36).slice(2); localStorage.setItem('vally_user_id', id); }
  return id;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function timeStr(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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

const QUICK_REACTIONS = ['💙', '❤️', '😊', '😘', '🥺', '✨', '🌙', '🫶', '😂', '🔥'];

// Detect media type from file
function getMediaType(file: File): 'image' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

// Upload media to Supabase Storage
async function uploadMedia(
  file: File,
  onProgress: (pct: number) => void
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop();
  const path = `chat/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  onProgress(10);
  const { error } = await supabase.storage.from('memories').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) { console.error(error); return null; }
  onProgress(90);
  const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(path);
  onProgress(100);
  return { url: publicUrl, path };
}

// Image lightbox
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <X size={20} />
      </button>
      <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }}
        src={url} className="max-w-full max-h-full object-contain rounded-xl"
        onClick={e => e.stopPropagation()} />
    </motion.div>
  );
}

// Media bubble
function MediaBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  if (msg.media_type === 'image') {
    return (
      <>
        <div className={`relative rounded-2xl overflow-hidden cursor-pointer group max-w-[280px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}
          onClick={() => setLightbox(msg.media_url!)}>
          <img src={msg.media_url} alt="photo"
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ maxHeight: 320 }} />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
          {msg.content && (
            <div className="px-3 py-2 text-sm" style={{ background: isMe ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)' }}>
              {msg.content}
            </div>
          )}
        </div>
        <AnimatePresence>
          {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
        </AnimatePresence>
      </>
    );
  }

  if (msg.media_type === 'video') {
    return (
      <div className={`relative rounded-2xl overflow-hidden max-w-[320px] ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}>
        <video
          ref={setVideoRef}
          src={msg.media_url}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-2xl"
          style={{ maxHeight: 400 }}
        />
        {msg.content && (
          <p className="px-3 py-2 text-sm opacity-80">{msg.content}</p>
        )}
      </div>
    );
  }

  // Document
  return (
    <a href={msg.media_url} target="_blank" rel="noopener noreferrer" download={msg.media_name}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[280px] transition-all hover:scale-[1.02] active:scale-95 ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}
      style={isMe
        ? { background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }
        : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }
      }>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20' : 'bg-romantic-blue/20'}`}>
        <File size={20} className={isMe ? 'text-white' : 'text-romantic-blue'} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{msg.media_name || 'Document'}</p>
        {msg.media_size && <p className="text-[10px] opacity-60 mt-0.5">{formatSize(msg.media_size)}</p>}
      </div>
      <Download size={16} className="opacity-60 flex-shrink-0" />
    </a>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState<UploadingMedia[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const myId = getMyId();
  const myName = getMyName();
  const { partnerOnline, partnerPage } = usePresence();
  const partnerName = getPartnerName();

  useEffect(() => {
    supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(200)
      .then(({ data }) => setMessages((data as Message[]) || []));

    const channel = supabase.channel('chat-messages-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  const sendMessage = async (content: string, type: Message['type'] = 'text', mediaData?: Partial<Message>) => {
    if (!content.trim() && !mediaData?.media_url) return;
    setSending(true);
    await supabase.from('messages').insert({
      id: crypto.randomUUID(),
      content: content.trim(),
      author: myName,
      author_id: myId,
      type,
      ...mediaData,
    });

    // Notify partner if they're not currently on chat page
    if (!partnerOnline || partnerPage !== 'chat') {
      const notifBody = type === 'media'
        ? mediaData?.media_type === 'image' ? '📸 Sent a photo'
          : mediaData?.media_type === 'video' ? '🎥 Sent a video'
          : '📄 Sent a document'
        : content.trim();

      supabase.functions.invoke('send-push', {
        body: {
          senderName: myName,
          title: `${myName} 💙`,
          message: notifBody,
        },
      }).catch(() => {});
    }

    setInput('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const mediaType = getMediaType(file);
    const uploadId = Math.random().toString(36).slice(2);
    const previewUrl = mediaType === 'image' ? URL.createObjectURL(file) : undefined;

    setUploading(prev => [...prev, { id: uploadId, name: file.name, progress: 0, type: mediaType, previewUrl }]);
    setShowAttachMenu(false);

    const result = await uploadMedia(file, (pct) => {
      setUploading(prev => prev.map(u => u.id === uploadId ? { ...u, progress: pct } : u));
    });

    setUploading(prev => prev.filter(u => u.id !== uploadId));
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (result) {
      await sendMessage('', 'media', {
        media_url: result.url,
        media_type: mediaType,
        media_name: file.name,
        media_size: file.size,
        storage_path: result.path,
      });
    }
  }, []);

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  }, [handleFileUpload]);

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = dateSeparator(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (!last || last.date !== date) groupedMessages.push({ date, messages: [msg] });
    else last.messages.push(msg);
  });

  return (
    <div className="flex flex-col h-screen pt-16 pb-16 md:pb-0"
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.15)', border: '3px dashed rgba(59,130,246,0.5)' }}>
            <div className="text-center">
              <Paperclip size={48} className="text-romantic-blue mx-auto mb-3" />
              <p className="text-xl font-bold text-romantic-blue">Drop to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center gap-3"
        style={{ background: 'rgba(4,5,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#04050f] transition-all ${partnerOnline ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-white/20'}`} />
        </div>
        <div className="flex-1">
          <p className="font-bold">{partnerName}</p>
          <motion.p
            key={partnerOnline ? 'online' : 'offline'}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className={`text-[11px] font-mono ${partnerOnline ? 'text-green-400' : 'opacity-30'}`}>
            {partnerOnline ? `● Online${partnerPage ? ` · ${partnerPage}` : ''}` : '○ Offline'}
          </motion.p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: 'rgba(4,5,15,0.5)' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Heart size={48} className="text-romantic-blue/40" />
            </motion.div>
            <p className="text-sm font-serif italic opacity-30">Say something sweet 💙</p>
            <p className="text-[10px] font-mono opacity-20">You can also drag & drop files here</p>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            <div className="flex items-center justify-center my-6">
              <div className="h-px flex-1 bg-white/5" />
              <span className="mx-3 text-[10px] font-mono opacity-20 uppercase tracking-widest px-3 py-1 glass rounded-full">
                {group.date}
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="space-y-1">
              {group.messages.map((msg, i) => {
                const isMe = msg.author_id === myId;
                const prevMsg = group.messages[i - 1];
                const isSameAuthor = prevMsg?.author_id === msg.author_id;
                const isReaction = msg.type === 'reaction';
                const isMedia = msg.type === 'media';

                if (isReaction) {
                  return (
                    <motion.div key={msg.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-2`}>
                      <span className="text-3xl drop-shadow-lg">{msg.content}</span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameAuthor ? 'mt-0.5' : 'mt-4'}`}
                  >
                    {/* Avatar — partner */}
                    {!isMe && !isSameAuthor && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-romantic-blue to-romantic-cyan flex items-center justify-center mr-2 flex-shrink-0 mt-auto shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        <Heart size={12} className="text-white fill-white" />
                      </div>
                    )}
                    {!isMe && isSameAuthor && <div className="w-7 mr-2 flex-shrink-0" />}

                    <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isSameAuthor && !isMe && (
                        <span className="text-[10px] font-mono opacity-30 ml-1 mb-0.5">{msg.author}</span>
                      )}

                      {isMedia ? (
                        <MediaBubble msg={msg} isMe={isMe} />
                      ) : (
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed ${isMe ? 'text-white rounded-[18px] rounded-br-md' : 'text-white/90 rounded-[18px] rounded-bl-md'}`}
                          style={isMe
                            ? { background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }
                            : { background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }
                          }
                        >
                          {msg.content}
                        </div>
                      )}

                      <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[9px] font-mono opacity-20 mx-1">{timeStr(msg.created_at)}</span>
                        {isMe && <CheckCheck size={10} className="opacity-20" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Uploading previews */}
        {uploading.map(u => (
          <div key={u.id} className={`flex justify-end mt-2`}>
            <div className="max-w-[240px] glass rounded-2xl overflow-hidden border border-white/10">
              {u.previewUrl && (
                <div className="relative">
                  <img src={u.previewUrl} className="w-full object-cover opacity-60" style={{ maxHeight: 200 }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                </div>
              )}
              {!u.previewUrl && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Loader2 size={18} className="animate-spin text-romantic-blue" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate opacity-60">{u.name}</p>
                    <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-romantic-blue rounded-full"
                        animate={{ width: `${u.progress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-white/5 px-3 py-3"
        style={{ background: 'rgba(4,5,15,0.92)', backdropFilter: 'blur(30px)' }}>

        {/* Quick reactions */}
        <AnimatePresence>
          {showReactions && (
            <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 8, height: 0 }}
              className="flex gap-2 mb-3 overflow-hidden flex-wrap">
              {QUICK_REACTIONS.map(r => (
                <motion.button key={r} whileTap={{ scale: 0.8 }} whileHover={{ scale: 1.2 }}
                  onClick={() => { sendMessage(r, 'reaction'); setShowReactions(false); }}
                  className="text-2xl">
                  {r}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attach menu */}
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="flex gap-2 mb-3">
              <button onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                <ImageIcon size={20} className="text-white" />
                <span className="text-[9px] font-mono text-white uppercase tracking-wider">Photo</span>
              </button>
              <button onClick={() => { videoInputRef.current?.click(); setShowAttachMenu(false); }}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}>
                <Video size={20} className="text-white" />
                <span className="text-[9px] font-mono text-white uppercase tracking-wider">Video</span>
              </button>
              <button onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                <FileText size={20} className="text-white" />
                <span className="text-[9px] font-mono text-white uppercase tracking-wider">Doc</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Emoji */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setShowReactions(!showReactions); setShowAttachMenu(false); }}
            className={`p-2.5 rounded-2xl transition-all flex-shrink-0 ${showReactions ? 'text-romantic-blue' : 'opacity-50 hover:opacity-100'}`}
            style={showReactions ? { background: 'rgba(59,130,246,0.15)' } : {}}>
            <Smile size={20} />
          </motion.button>

          {/* Attach */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setShowAttachMenu(!showAttachMenu); setShowReactions(false); }}
            className={`p-2.5 rounded-2xl transition-all flex-shrink-0 ${showAttachMenu ? 'text-romantic-blue' : 'opacity-50 hover:opacity-100'}`}
            style={showAttachMenu ? { background: 'rgba(59,130,246,0.15)' } : {}}>
            <Paperclip size={20} />
          </motion.button>

          {/* Text input */}
          <div className="flex-1 flex items-center rounded-2xl px-4 py-2.5 min-h-[44px]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Say something sweet..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-25" />
          </div>

          {/* Send */}
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-2xl flex-shrink-0 transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <Send size={18} className="text-white" />
          </motion.button>
        </div>

        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => Array.from(e.target.files || []).forEach(handleFileUpload)} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip,.rar,.xls,.xlsx,.ppt,.pptx" multiple className="hidden"
          onChange={e => Array.from(e.target.files || []).forEach(handleFileUpload)} />
      </div>
    </div>
  );
}
