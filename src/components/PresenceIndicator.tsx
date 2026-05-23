import { motion, AnimatePresence } from 'motion/react';
import { usePresence } from '../hooks/usePresence';
import { Heart, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

function getPartnerName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person2 || 'Your love';
  } catch { return 'Your love'; }
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Home 🏠',
  timeline: 'Timeline 💌',
  memories: 'Gallery 📸',
  stats: 'Stats 📊',
  spotify: 'Playlist 🎵',
  ai: 'AI Letters ✨',
  wishlist: 'Wishlist ⭐',
  core: 'Moon 🌙',
};

// Inline pill for Navbar — compact, no floating
export function PresencePill() {
  const { partnerOnline, partnerPage, onlineUsers } = usePresence();
  const [partnerName] = useState(getPartnerName);
  const pageLabel = partnerPage ? (PAGE_LABELS[partnerPage] || partnerPage) : null;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wide transition-all duration-500 ${
        partnerOnline
          ? 'bg-green-500/10 border border-green-400/20 text-green-300'
          : 'bg-white/5 border border-white/10 opacity-50'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        partnerOnline
          ? 'bg-green-400 animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]'
          : 'bg-white/30'
      }`} />
      <span className="whitespace-nowrap">
        {partnerOnline
          ? pageLabel ? `${partnerName} · ${pageLabel}` : partnerName
          : 'Offline'}
      </span>
    </motion.div>
  );
}

// Toast only — shown when partner comes online
export default function PresenceIndicator() {
  const { partnerOnline, onlineUsers } = usePresence();
  const [partnerName] = useState(getPartnerName);
  const [showToast, setShowToast] = useState(false);
  const [prevOnline, setPrevOnline] = useState(false);
  const myId = localStorage.getItem('vally_user_id') || '';
  const partner = onlineUsers.find(u => u.userId !== myId);

  useEffect(() => {
    if (partnerOnline && !prevOnline) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
    setPrevOnline(partnerOnline);
  }, [partnerOnline]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="glass px-5 py-3 rounded-2xl border border-green-400/20 shadow-2xl flex items-center gap-3 whitespace-nowrap">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: 2 }}>
              <Heart size={16} className="text-green-400 fill-green-400" />
            </motion.div>
            <div>
              <p className="text-sm font-bold">{partnerName} is here 💙</p>
              <p className="text-[10px] opacity-40 font-mono">Your love just opened the app</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
