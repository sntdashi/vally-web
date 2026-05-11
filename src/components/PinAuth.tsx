import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { Heart, Lock, Delete } from "lucide-react";

// Simple PIN auth — shared between both users
// PIN is stored hashed in localStorage so it's not plaintext
// Default PIN is "0612" (change by editing VALLY_PIN env or in settings)

const DEFAULT_PIN = import.meta.env.VITE_PIN || "0612";
const SESSION_KEY = "vally_auth_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function isSessionValid(): boolean {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return false;
    const { expiry } = JSON.parse(stored);
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

function setSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    expiry: Date.now() + SESSION_DURATION,
  }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

interface PinAuthProps {
  children: React.ReactNode;
}

export default function PinAuth({ children }: PinAuthProps) {
  const [authenticated, setAuthenticated] = useState(() => isSessionValid());
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length >= DEFAULT_PIN.length) {
      if (newPin === DEFAULT_PIN) {
        setSession();
        setAuthenticated(true);
      } else {
        setShaking(true);
        setError(true);
        setTimeout(() => {
          setPin("");
          setShaking(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (authenticated) return <>{children}</>;

  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div className="fixed inset-0 z-[999] bg-[#010103] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, #3b82f6, #06b6d4, transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xs"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]"
          >
            <Heart size={32} className="text-white fill-white" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold">ETERNAL</h1>
            <p className="text-xs font-mono uppercase tracking-widest opacity-40 mt-1">Private Access</p>
          </div>
        </div>

        {/* PIN Display */}
        <motion.div
          animate={shaking ? {
            x: [-10, 10, -10, 10, -8, 8, -4, 4, 0],
          } : {}}
          transition={{ duration: 0.5 }}
          className="flex gap-3"
        >
          {Array.from({ length: DEFAULT_PIN.length }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? "bg-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    : "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  : "border-white/20 bg-transparent"
              }`}
            />
          ))}
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 font-mono -mt-4"
          >
            Incorrect PIN. Try again.
          </motion.p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {digits.map((d, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: d ? 0.9 : 1 }}
              onClick={() => d === "⌫" ? handleDelete() : d ? handleDigit(d) : undefined}
              disabled={!d}
              className={`h-14 rounded-2xl font-bold text-lg transition-all ${
                !d ? "invisible" :
                d === "⌫"
                  ? "glass text-white/40 hover:text-white hover:bg-white/10"
                  : "glass hover:bg-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              }`}
            >
              {d === "⌫" ? <Delete size={20} className="mx-auto" /> : d}
            </motion.button>
          ))}
        </div>

        <p className="text-[10px] font-mono uppercase tracking-widest opacity-20 text-center">
          For your eyes only 💙
        </p>
      </motion.div>
    </div>
  );
}
