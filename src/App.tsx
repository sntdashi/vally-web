import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { PerformanceProvider } from "./hooks/usePerformance";
import { PresenceProvider } from "./hooks/usePresence";
import PinAuth from "./components/PinAuth";
import Layout from "./components/Layout";

import HomePage from "./pages/HomePage";
import TimelinePage from "./pages/TimelinePage";
import MemoriesPage from "./pages/MemoriesPage";
import CorePage from "./pages/CorePage";
import PlaylistPage from "./pages/PlaylistPage";
import LettersPage from "./pages/LettersPage";
import WishlistPage from "./pages/WishlistPage";
import ChatPage from "./pages/ChatPage";

function AppContent() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <Layout isDark={isDark} onThemeToggle={() => setIsDark(!isDark)}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/core" element={<CorePage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PinAuth>
        <PerformanceProvider>
          <PresenceProvider>
            <AppContent />
          </PresenceProvider>
        </PerformanceProvider>
      </PinAuth>
    </BrowserRouter>
  );
}
