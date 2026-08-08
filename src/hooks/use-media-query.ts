"use client";

import { useCallback, useSyncExternalStore } from "react";

// SSR-safe media query subscription. The server snapshot reports `false`
// (desktop-first), so markup matches the static shell and narrow-screen
// adjustments apply right after hydration.
export const useMediaQuery = (query: string): boolean => {
   const subscribe = useCallback(
      (onStoreChange: () => void) => {
         const mql = window.matchMedia(query);
         mql.addEventListener("change", onStoreChange);
         return () => mql.removeEventListener("change", onStoreChange);
      },
      [query],
   );

   return useSyncExternalStore(
      subscribe,
      () => window.matchMedia(query).matches,
      () => false,
   );
};

// Shared breakpoint for chart layout tweaks (Tailwind `sm`).
export const useIsNarrowViewport = () => useMediaQuery("(max-width: 640px)");
