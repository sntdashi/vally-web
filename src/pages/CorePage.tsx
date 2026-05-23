import { Suspense, lazy, useEffect } from "react";
import { usePresence } from "../hooks/usePresence";
const LoveCore3D = lazy(() => import("../components/LoveCore3D"));

export default function CorePage() {
  const { updatePage } = usePresence();
  useEffect(() => { updatePage('core'); }, []);
  return (
    <div className="min-h-screen pt-20">
      <Suspense fallback={<div className="h-[500px] flex items-center justify-center opacity-20">Loading Core...</div>}>
        <LoveCore3D />
      </Suspense>
    </div>
  );
}
