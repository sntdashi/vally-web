import { motion } from "motion/react";
import GlassCard from "./GlassCard";

interface SpotifyPlaylistProps {
  isDark: boolean;
}

export default function SpotifyPlaylist({ isDark }: SpotifyPlaylistProps) {
  // Replace this with your actual Spotify Playlist ID
  const playlistId = "29T3bKXcvy7ZluKyeL3NoP?"; // Example: "Indie Pop" playlist

  return (
    <section id="spotify" className="py-16 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4 md:mb-6">Our Spotify Playlist</h2>
        <p className="opacity-60 text-sm md:text-base">The soundtrack to our love story, curated just for us.</p>
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/5">
        <iframe
          style={{ borderRadius: "12px" }}
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=${isDark ? '0' : '1'}`}
          width="100%"
          height="400"
          className="md:h-[500px]"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </GlassCard>
      
      <div className="mt-6 md:mt-8 text-center">
        <p className="opacity-20 text-[10px] md:text-xs font-mono uppercase tracking-widest px-4">
          Note: You might need to log in to Spotify to hear full tracks.
        </p>
      </div>
    </section>
  );
}
