import { motion } from "motion/react";
import { Music2, ExternalLink, Headphones, Play } from "lucide-react";
import GlassCard from "./GlassCard";

interface SpotifyPlaylistProps {
  isDark: boolean;
}

// Spotify embed is broken on mobile without the app installed.
// Best UX: show track list + direct open-in-Spotify link.
const PLAYLIST_ID = "29T3bKXcvy7ZluKyeL3NoP";
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;

const FEATURED_TRACKS = [
  { title: "Add your favorite song", artist: "Edit this list in SpotifyPlaylist.tsx" },
  { title: "Our first song together", artist: "Artist name" },
  { title: "That one song on repeat", artist: "Artist name" },
  { title: "Late night drive song", artist: "Artist name" },
  { title: "Morning playlist", artist: "Artist name" },
];

export default function SpotifyPlaylist({ isDark }: SpotifyPlaylistProps) {
  return (
    <section id="spotify" className="py-16 md:py-24 px-4 md:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-10 md:mb-14">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Music2 size={16} className="text-[#1DB954]" />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Our Soundtrack</span>
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4">Our Playlist 💙</h2>
        <p className="opacity-50 text-sm">The songs that tell our story</p>
      </div>

      <GlassCard className="overflow-hidden">
        {/* Spotify-green header */}
        <div className="p-5 md:p-6 border-b border-white/5"
          style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.15), rgba(29,185,84,0.05))' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#1DB954' }}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm">Our Playlist</p>
                <p className="text-[10px] opacity-40 font-mono uppercase tracking-wider">Vally & Pikri</p>
              </div>
            </div>
            <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs text-black transition-all hover:scale-105 active:scale-95"
              style={{ background: '#1DB954' }}>
              <Play size={12} className="fill-black" />
              Open in Spotify
            </a>
          </div>
        </div>

        {/* Track list */}
        <div className="divide-y divide-white/5">
          {FEATURED_TRACKS.map((track, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors group">
              <span className="text-xs font-mono opacity-20 w-4 text-center flex-shrink-0">{i + 1}</span>
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1DB954]/20 transition-colors">
                <Music2 size={14} className="opacity-30 group-hover:text-[#1DB954] group-hover:opacity-100 transition-all" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs opacity-40 truncate">{track.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 opacity-40">
            <Headphones size={14} />
            <span className="text-xs font-mono">Listen together</span>
          </div>
          <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#1DB954' }}>
            Full playlist <ExternalLink size={12} />
          </a>
        </div>
      </GlassCard>

      <p className="text-center text-[10px] font-mono opacity-20 mt-4 uppercase tracking-widest">
        Tap "Open in Spotify" to listen to the full playlist
      </p>
    </section>
  );
}
