import { motion } from "motion/react";
import { Heart, Calendar, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getDaysTogether, getConfig } from "../lib/config";

export default function StatsDashboard() {
  const [days, setDays] = useState(0);
  const [config, setConfig] = useState(getConfig());

  useEffect(() => {
    setDays(getDaysTogether());
    setConfig(getConfig());
  }, []);

  const stats = [
    { label: "Days Together", value: days.toLocaleString(), icon: <Calendar className="text-romantic-blue" /> },
    { label: "Memories Made", value: config.stats.memoriesCount, icon: <Star className="text-romantic-cyan" /> },
    { label: "Places Visited", value: config.stats.placesVisited, icon: <MapPin className="text-blue-400" /> },
    { label: "Love Level", value: "∞", icon: <Heart className="text-blue-500 fill-blue-500" /> },
  ];

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass p-6 md:p-8 rounded-3xl group hover:border-romantic-blue/30 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <span className="opacity-20 font-mono text-[10px] md:text-xs uppercase tracking-widest">Live Data</span>
            </div>
            <div className="text-3xl md:text-4xl font-serif font-bold mb-2">{stat.value}</div>
            <div className="opacity-40 text-xs md:text-sm font-medium uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
