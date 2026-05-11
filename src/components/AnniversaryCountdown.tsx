import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Timer, Gift } from "lucide-react";
import GlassCard from "./GlassCard";
import { getNextAnniversary, getConfig } from "../lib/config";

function useThemeColors() {
  const [colors, setColors] = useState({ primary: "#3b82f6", secondary: "#06b6d4" });

  useEffect(() => {
    const updateColors = () => {
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue("--primary").trim() || "#3b82f6";
      const secondary = style.getPropertyValue("--secondary").trim() || "#06b6d4";
      setColors({ primary, secondary });
    };

    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}

export default function AnniversaryCountdown() {
  const { primary, secondary } = useThemeColors();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const config = getConfig();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const anniversaryDate = getNextAnniversary();
      const difference = anniversaryDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  // Format the anniversary date for display
  const [month, day] = config.relationship.anniversaryDate.split('-').map(Number);
  const anniversaryDisplay = new Date(2000, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
        >
          <Timer size={16} style={{ color: primary }} />
          <span className="text-xs font-bold tracking-widest uppercase">Next Milestone</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Countdown to Our Anniversary</h2>
        <p className="opacity-60">Every second brings us closer to another year of magic.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {timeUnits.map((unit, index) => (
          <GlassCard key={unit.label} delay={index * 0.1} className="text-center p-6 md:p-8">
            <motion.div
              key={unit.value}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ color: primary }}
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-2"
            >
              {unit.value.toString().padStart(2, '0')}
            </motion.div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-widest opacity-40">{unit.label}</div>
          </GlassCard>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        style={{ color: secondary }}
        className="mt-12 flex items-center justify-center gap-3"
      >
        <Gift size={20} />
        <span className="font-serif italic text-lg">{anniversaryDisplay} — Our special day</span>
      </motion.div>
    </section>
  );
}
