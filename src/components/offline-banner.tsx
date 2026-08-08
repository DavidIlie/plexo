"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
   const isOffline = useOffline();

   if (!isOffline) return null;

   return (
      <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur-sm md:bottom-6">
         <WifiOff className="size-4 text-primary" />
         You&apos;re offline — retrying when you reconnect.
      </div>
   );
}
