import { Suspense, lazy, useEffect, useState } from "react";
import { usePresence } from "../hooks/usePresence";
const SpotifyPlaylist = lazy(() => import("../components/SpotifyPlaylist"));

export default function PlaylistPage() {
  const { updatePage } = usePresence();
  const [isDark] = useState(true);
  useEffect(() => { updatePage('spotify'); }, []);
  return (
    <div className="min-h-screen pt-20">
      <Suspense fallback={<div className="h-96 flex items-center justify-center opacity-20">Loading Playlist...</div>}>
        <SpotifyPlaylist isDark={isDark} />
      </Suspense>
    </div>
  );
}
