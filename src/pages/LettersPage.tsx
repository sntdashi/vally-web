import { Suspense, lazy, useEffect } from "react";
import { usePresence } from "../hooks/usePresence";
const AILoveLetter = lazy(() => import("../components/AILoveLetter"));

export default function LettersPage() {
  const { updatePage } = usePresence();
  useEffect(() => { updatePage('ai'); }, []);
  return (
    <div className="min-h-screen pt-20">
      <Suspense fallback={<div className="h-96 flex items-center justify-center opacity-20">Initializing AI...</div>}>
        <AILoveLetter />
      </Suspense>
    </div>
  );
}
