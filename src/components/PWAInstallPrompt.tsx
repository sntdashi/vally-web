import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Download, X, Heart, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('pwa_dismissed') === 'true'
  );

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    if (isInStandaloneMode || dismissed) return;

    if (isIOS) {
      // Show iOS guide after 30s
      const timer = setTimeout(() => setShowIOSGuide(true), 30000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 5000); // Show after 5s
    };

    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    setDismissed(true);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (isInStandaloneMode || dismissed) return null;

  return (
    <AnimatePresence>
      {(showPrompt || showIOSGuide) && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-4 right-4 z-[150] max-w-sm mx-auto"
        >
          <div className="glass rounded-3xl p-5 border border-white/10 shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(59,130,246,0.15)' }}>
            <button onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100">
              <X size={14} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                <Heart size={22} className="text-white fill-white" />
              </div>
              <div className="flex-1 pr-4">
                <p className="font-bold text-sm mb-0.5">Add to Home Screen</p>
                <p className="text-xs opacity-50 leading-relaxed">
                  {isIOS
                    ? 'Tap the share button → "Add to Home Screen" to install Vally'
                    : 'Install Vally as an app for the full experience 💙'
                  }
                </p>
              </div>
            </div>

            {!isIOS && (
              <button onClick={handleInstall}
                className="mt-4 w-full py-3 rounded-2xl bg-romantic-blue text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                <Download size={16} />
                Install App
              </button>
            )}

            {isIOS && (
              <div className="mt-4 p-3 rounded-2xl bg-white/5 text-xs font-mono opacity-60 text-center">
                Tap <strong>⬆ Share</strong> → <strong>Add to Home Screen</strong>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
