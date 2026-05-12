import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function NotificationSettings() {
  const { status, isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [justDone, setJustDone] = useState(false);

  if (!isSupported || status === 'unsupported') return null;

  const handleToggle = async () => {
    setLoading(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setLoading(false);
    setJustDone(true);
    setTimeout(() => setJustDone(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-bold">Partner Notifications</p>
        <p className="text-xs opacity-40 mt-0.5">
          {status === 'denied'
            ? 'Notifications blocked — enable in browser settings'
            : isSubscribed
            ? 'You\'ll get notified when your love opens the app'
            : 'Get notified when your love opens Vally'}
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        disabled={loading || status === 'denied'}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
          status === 'denied'
            ? 'glass opacity-30 cursor-not-allowed'
            : isSubscribed
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : 'bg-romantic-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        }`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : justDone ? (
          <Check size={14} />
        ) : isSubscribed ? (
          <><Bell size={14} /> On</>
        ) : (
          <><BellOff size={14} /> Off</>
        )}
      </motion.button>
    </div>
  );
}
