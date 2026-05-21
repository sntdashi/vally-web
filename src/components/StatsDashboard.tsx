import { motion } from "motion/react";
import { Heart, Calendar, MapPin, Star, Image, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getDaysTogether, getConfig } from "../lib/config";
import { supabase } from "../lib/supabase";

interface LiveStats {
  memoriesCount: number;
  locationsCount: number;
  timelineCount: number;
  wishlistDone: number;
  wishlistTotal: number;
  notesCount: number;
}

async function fetchLiveStats(): Promise<LiveStats> {
  const [memories, locations, timeline, wishlist, notes] = await Promise.all([
    supabase.from('memories').select('id', { count: 'exact', head: true }),
    supabase.from('memories').select('id', { count: 'exact', head: true }).not('location_lat', 'is', null),
    supabase.from('timeline_events').select('id', { count: 'exact', head: true }),
    supabase.from('wishlist').select('id, completed'),
    supabase.from('sweet_notes').select('id', { count: 'exact', head: true }),
  ]);

  const wishlistData = wishlist.data || [];

  return {
    memoriesCount: memories.count || 0,
    locationsCount: (locations.count || 0) + (await supabase.from('timeline_events').select('id', { count: 'exact', head: true }).not('lat', 'is', null)).count || 0,
    timelineCount: timeline.count || 0,
    wishlistDone: wishlistData.filter(w => w.completed).length,
    wishlistTotal: wishlistData.length,
    notesCount: notes.count || 0,
  };
}

export default function StatsDashboard() {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const config = getConfig();

  useEffect(() => {
    // Update days + hours every second
    const updateTime = () => {
      const start = new Date(config.relationship.startDate);
      const diff = Date.now() - start.getTime();
      setDays(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60); // update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLiveStats().then(setLiveStats);

    // Subscribe to changes
    const channels = [
      supabase.channel('stats-memories').on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, () => fetchLiveStats().then(setLiveStats)).subscribe(),
      supabase.channel('stats-wishlist').on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => fetchLiveStats().then(setLiveStats)).subscribe(),
      supabase.channel('stats-timeline').on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_events' }, () => fetchLiveStats().then(setLiveStats)).subscribe(),
    ];

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  const stats = [
    {
      label: "Days Together",
      value: days.toLocaleString(),
      sub: `${hours}h today`,
      icon: <Calendar className="text-romantic-blue" size={24} />,
      color: "romantic-blue",
    },
    {
      label: "Memories",
      value: liveStats ? liveStats.memoriesCount.toLocaleString() : config.stats.memoriesCount,
      sub: liveStats ? `${liveStats.timelineCount} timeline moments` : 'Loading...',
      icon: <Image className="text-romantic-cyan" size={24} />,
      color: "romantic-cyan",
    },
    {
      label: "Places Together",
      value: liveStats ? liveStats.locationsCount.toString() : config.stats.placesVisited,
      sub: "pinned on map",
      icon: <MapPin className="text-blue-400" size={24} />,
      color: "blue-400",
    },
    {
      label: "Wishlist",
      value: liveStats ? `${liveStats.wishlistDone}/${liveStats.wishlistTotal}` : '—',
      sub: liveStats ? `${liveStats.wishlistTotal - liveStats.wishlistDone} remaining` : 'Loading...',
      icon: <Star className="text-yellow-400" size={24} />,
      color: "yellow-400",
    },
  ];

  return (
    <section id="stats" className="py-16 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass p-4 md:p-8 rounded-3xl group hover:border-romantic-blue/30 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div className="p-2 md:p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <span className="opacity-20 font-mono text-[8px] md:text-xs uppercase tracking-widest">Live</span>
            </div>
            <div className="text-2xl md:text-4xl font-serif font-bold mb-1">{stat.value}</div>
            <div className="opacity-40 text-[10px] md:text-sm font-medium uppercase tracking-wider">{stat.label}</div>
            {stat.sub && (
              <div className="opacity-25 text-[9px] md:text-xs font-mono mt-1">{stat.sub}</div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
