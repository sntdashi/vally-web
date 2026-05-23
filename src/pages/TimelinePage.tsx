import { Suspense, lazy, useEffect } from "react";
import { usePresence } from "../hooks/usePresence";
const LoveTimeline = lazy(() => import("../components/LoveTimeline"));

export default function TimelinePage() {
  const { updatePage } = usePresence();
  useEffect(() => { updatePage('timeline'); }, []);
  return (
    <div className="min-h-screen pt-20">
      <Suspense fallback={<div className="h-96 flex items-center justify-center opacity-20">Loading Timeline...</div>}>
        <LoveTimeline />
      </Suspense>
    </div>
  );
}
