import { motion, AnimatePresence } from 'motion/react';
import { usePresence } from '../hooks/usePresence';
import { Heart, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

function getPartnerName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person2 || 'Your love';
  } catch { return 'Your love'; }
}

export default function PresenceIndicator() {
  const { partnerOnline, onlineUsers } = usePresence();
  const [partnerName] = useState(getPartnerName);
  const [showToast, setShowToast] = useState(false);
  const [prevOnline, setPrevOnline] = useState(false);

  // Show toast when partner comes online
  useEffect(() => {
    if (partnerOnline && !prevOnline) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
    setPrevOnline(partnerOnline);
  }, [partnerOnline]);

  const partner = onlineUsers.find(u => u.userId !== localStorage.getItem('vally_user_id'));

  return (
    <>
      {/* Persistent status pill — top right */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[90]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-full glass border transition-all duration-500 ${
            partnerOnline
              ? 'border-green-400/30 shadow-[0_0_15px_rgba(74,222,128,0.15)]'
              : 'border-white/10'
          }`}
        >
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
            partnerOnline
              ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] animate-pulse'
              : 'bg-white/20'
          }`} />
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
            {partnerOnline ? partnerName : 'Offline'}
          </span>
          {partnerOnline && partner?.page && (
            <span className="text-[9px] font-mono opacity-30">
              · {partner.page}
            </span>
          )}
        </motion.div>
      </div>

      {/* Toast notification when partner comes online */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="glass px-6 py-4 rounded-2xl border border-green-400/20 shadow-2xl flex items-center gap-3 whitespace-nowrap">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                <Heart size={18} className="text-green-400 fill-green-400" />
              </motion.div>
              <div>
                <p className="text-sm font-bold">{partnerName} is here 💙</p>
                <p className="text-[10px] opacity-40 font-mono">Your love just opened the app</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
