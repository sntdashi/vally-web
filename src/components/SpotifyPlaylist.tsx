import { motion } from "motion/react";
import { Music2, ExternalLink, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

interface SpotifyPlaylistProps {
  isDark: boolean;
}

const PLAYLIST_ID = "29T3bKXcvy7ZluKyeL3NoP";
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
const DEEP_LINK = `spotify:playlist:${PLAYLIST_ID}`;

export default function SpotifyPlaylist({ isDark }: SpotifyPlaylistProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

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

      {isMobile ? (
        // Mobile: proper open-in-app card
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl overflow-hidden border border-white/10"
        >
          {/* Green header */}
          <div className="p-6 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #1DB954 0%, #158a3e 100%)' }}>
            <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div className="text-white">
              <p className="font-bold text-lg">Our Playlist</p>
              <p className="text-white/70 text-sm">Vally & Pikri • Spotify</p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm opacity-60 leading-relaxed text-center">
              Buka Spotify buat denger full playlist kita 🎵
            </p>

            {/* Open in app button */}
            <a href={DEEP_LINK}
              className="w-full py-4 rounded-2xl font-bold text-white text-center flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              style={{ background: '#1DB954' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Buka di Spotify
            </a>

            {/* Fallback web link */}
            <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl font-bold text-sm text-center glass hover:bg-white/10 transition-all flex items-center justify-center gap-2 opacity-60 hover:opacity-100">
              <ExternalLink size={14} />
              Atau buka di browser
            </a>
          </div>
        </motion.div>
      ) : (
        // Desktop: full Spotify embed
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(29,185,84,0.1)' }}
        >
          <iframe
            src={`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=${isDark ? 0 : 1}`}
            width="100%"
            height="500"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: '24px' }}
          />
        </motion.div>
      )}
    </section>
  );
}
