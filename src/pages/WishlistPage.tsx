import { Suspense, lazy, useEffect } from "react";
import { usePresence } from "../hooks/usePresence";
const WishlistVault = lazy(() => import("../components/WishlistVault"));

export default function WishlistPage() {
  const { updatePage } = usePresence();
  useEffect(() => { updatePage('wishlist'); }, []);
  return (
    <div className="min-h-screen pt-20">
      <Suspense fallback={<div className="h-96 flex items-center justify-center opacity-20">Loading Wishlist...</div>}>
        <WishlistVault />
      </Suspense>
    </div>
  );
}
