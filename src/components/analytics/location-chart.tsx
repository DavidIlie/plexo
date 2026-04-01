"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useTRPC } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";

export const LocationChart = () => {
   const trpc = useTRPC();
   const { data, isLoading, isFetching } = useQuery({
      ...trpc.analytics.getLocationStats.queryOptions(),
      refetchInterval: 15 * 60 * 1000,
      gcTime: Infinity,
   });

   if (data?.data === null) return null;

   const isRefetching = isFetching && !isLoading;

   if (isLoading) {
      return (
         <div className="rounded-lg border border-border/50 p-4">
            <p className="mb-3 text-sm font-medium">Locations</p>
            <Skeleton className="h-[280px] w-full" />
         </div>
      );
   }

   const locations = data?.data ?? [];

   return (
      <div className="rounded-lg border border-border/50 p-4">
         <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-medium">Watch Locations</p>
            {isRefetching && (
               <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
         </div>
         {locations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
               No location data available
            </p>
         ) : (
            <div className={isRefetching ? "space-y-2 opacity-60 transition-opacity duration-300" : "space-y-2"}>
               {locations.map((loc) => (
                  <div
                     key={loc.location}
                     className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                  >
                     <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{loc.location}</span>
                     </div>
                     <span className="text-xs tabular-nums text-muted-foreground">
                        {loc.count} {loc.count !== 1 ? "entries" : "entry"}
                     </span>
                  </div>
               ))}
            </div>
         )}
         {data?.lastUpdatedAt && (
            <p className="mt-2 text-right text-[10px] text-muted-foreground/60">
               {isRefetching
                  ? `Refreshing\u2026 last updated ${formatDistanceToNow(new Date(data.lastUpdatedAt), { addSuffix: true })}`
                  : `Updated ${formatDistanceToNow(new Date(data.lastUpdatedAt), { addSuffix: true })}`}
            </p>
         )}
      </div>
   );
};
