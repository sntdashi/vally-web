import { Suspense, lazy, useEffect } from "react";
import { usePresence } from "../hooks/usePresence";
const MemoryVault = lazy(() => import("../components/MemoryVault"));

export default function MemoriesPage() {
  const { updatePage } = usePresence();
  useEffect(() => { updatePage('memories'); }, []);
  return (
    <div className="min-h-screen pt-20">
      <Suspense fallback={<div className="h-96 flex items-center justify-center opacity-20">Loading Memories...</div>}>
        <MemoryVault />
      </Suspense>
    </div>
  );
}
