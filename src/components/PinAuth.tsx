import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Heart, Delete } from "lucide-react";

const DEFAULT_PIN = import.meta.env.VITE_PIN || "0612";
const SESSION_KEY = "vally_auth_session";
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

function isSessionValid(): boolean {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return false;
    const { lastActive } = JSON.parse(stored);
    return Date.now() - lastActive < INACTIVITY_LIMIT;
  } catch { return false; }
}

function touchSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ lastActive: Date.now() }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function PinAuth({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => isSessionValid());
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [success, setSuccess] = useState(false);

  // Touch session on any user activity
  useEffect(() => {
    if (!authenticated) return;
    touchSession();
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    const handler = () => touchSession();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));

    // Check every 30s if session expired
    const interval = setInterval(() => {
      if (!isSessionValid()) setAuthenticated(false);
    }, 30_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearInterval(interval);
    };
  }, [authenticated]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length >= DEFAULT_PIN.length) {
      if (newPin === DEFAULT_PIN) {
        setSuccess(true);
        setTimeout(() => { touchSession(); setAuthenticated(true); }, 600);
      } else {
        setShaking(true);
        setError(true);
        setTimeout(() => { setPin(""); setShaking(false); setError(false); }, 700);
      }
    }
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false); };

  if (authenticated) return <>{children}</>;

  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: success ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: '#04050f' }}
    >
      {/* Layered background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full"
          style={{
            width: 700, height: 700,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -60%)',
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(6,182,212,0.08) 50%, transparent 75%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            bottom: '5%', left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center w-full max-w-[320px]"
        style={{ gap: 32 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center" style={{ gap: 16 }}>
          <motion.div
            animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 30px rgba(59,130,246,0.3)', '0 0 50px rgba(59,130,246,0.5)', '0 0 30px rgba(59,130,246,0.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
          >
            <Heart size={34} className="text-white fill-white" />
          </motion.div>

          <div className="text-center" style={{ gap: 6 }}>
            <h1
              className="font-serif font-bold tracking-[0.25em]"
              style={{ fontSize: 22, color: '#ffffff', letterSpacing: '0.25em' }}
            >
              ETERNAL
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', letterSpacing: '0.2em', marginTop: 6, fontFamily: 'monospace', textTransform: 'uppercase' }}>
              Private Access
            </p>
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex flex-col items-center" style={{ gap: 12 }}>
          <motion.div
            animate={shaking ? { x: [-12, 12, -10, 10, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.55 }}
            className="flex"
            style={{ gap: 14 }}
          >
            {Array.from({ length: DEFAULT_PIN.length }).map((_, i) => (
              <motion.div
                key={i}
                animate={i < pin.length ? { scale: [0.8, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: 14, height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${
                    i < pin.length
                      ? error ? '#f87171' : success ? '#4ade80' : '#3b82f6'
                      : 'rgba(255,255,255,0.2)'
                  }`,
                  backgroundColor: i < pin.length
                    ? error ? '#f87171' : success ? '#4ade80' : '#3b82f6'
                    : 'transparent',
                  boxShadow: i < pin.length && !error
                    ? `0 0 12px ${success ? 'rgba(74,222,128,0.6)' : 'rgba(59,130,246,0.6)'}`
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: 12, color: '#f87171', fontFamily: 'monospace' }}
              >
                Wrong PIN, try again
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 12, color: '#4ade80', fontFamily: 'monospace' }}
              >
                Welcome back 💙
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
          {digits.map((d, i) => {
            if (!d) return <div key={i} />;
            const isDelete = d === "⌫";
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => isDelete ? handleDelete() : handleDigit(d)}
                style={{
                  height: 58,
                  borderRadius: 16,
                  fontSize: isDelete ? 14 : 20,
                  fontWeight: 600,
                  color: isDelete ? 'rgba(148,163,184,0.9)' : '#ffffff',
                  background: isDelete
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = isDelete ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)')}
              >
                {isDelete ? <Delete size={18} /> : d}
              </motion.button>
            );
          })}
        </div>

        {/* Footer text */}
        <p style={{ fontSize: 11, color: 'rgba(100,116,139,0.8)', letterSpacing: '0.15em', fontFamily: 'monospace', textTransform: 'uppercase', textAlign: 'center' }}>
          For your eyes only 💙
        </p>
      </motion.div>
    </motion.div>
  );
}
