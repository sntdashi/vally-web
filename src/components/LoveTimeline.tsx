import { motion, useScroll, useTransform } from "motion/react";
import { Heart, Clock, MapPin, Stars } from "lucide-react";
import { useRef } from "react";

const events = [
  {
    date: "June 12, 2023",
    title: "The First Encounter",
    desc: "Where it all began. A simple coffee date that changed everything.",
    icon: (
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="text-romantic-blue" />
      </motion.div>
    ),
    image: "https://picsum.photos/seed/coffee/800/600"
  },
  {
    date: "August 24, 2023",
    title: "First Trip Together",
    desc: "Exploring the mountains and finding our rhythm.",
    icon: (
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <MapPin className="text-romantic-blue" />
      </motion.div>
    ),
    image: "https://picsum.photos/seed/mountain/800/600"
  },
  {
    date: "December 31, 2023",
    title: "New Year's Promise",
    desc: "Under the fireworks, we promised to build a future together.",
    icon: (
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Stars className="text-romantic-blue" />
      </motion.div>
    ),
    image: "https://picsum.photos/seed/fireworks/800/600"
  },
  {
    date: "Today",
    title: "The Eternal Now",
    desc: "Every second with you is a new favorite memory.",
    icon: (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <Clock className="text-romantic-blue" />
      </motion.div>
    ),
    image: "https://picsum.photos/seed/love/800/600"
  }
];

function TimelineItem({ event, index }: { event: typeof events[0], index: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
        index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="flex-1 w-full">
        <div className="glass rounded-3xl overflow-hidden group relative">
          <div className="relative h-64 md:h-80 overflow-hidden">
            <motion.img
              style={{ y }}
              src={event.image}
              alt={event.title}
              className="absolute inset-0 w-full h-[140%] object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 md:left-6">
              <span className="text-romantic-blue font-mono text-xs md:text-sm uppercase tracking-widest">
                {event.date}
              </span>
            </div>
          </div>
          <div className="p-6 md:p-8 relative bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              {event.icon}
              <h3 className="text-xl md:text-2xl font-serif font-bold">{event.title}</h3>
            </div>
            <p className="opacity-60 leading-relaxed text-sm md:text-base">{event.desc}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full glass border-romantic-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
        <div className="w-3 h-3 rounded-full bg-romantic-blue animate-pulse" />
      </div>

      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

export default function LoveTimeline() {
  return (
    <section id="timeline" className="py-16 md:py-24 px-4 md:px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4 md:mb-6">Our Journey</h2>
          <p className="opacity-60 text-sm md:text-base">A cinematic walkthrough of our most precious moments.</p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-romantic-blue/0 via-romantic-blue/50 to-romantic-blue/0 hidden md:block" />

          <div className="space-y-16 md:space-y-24">
            {events.map((event, index) => (
              <TimelineItem key={index} event={event} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
