"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";

export const LocationChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery({
      ...trpc.analytics.getLocationStats.queryOptions(),
      refetchInterval: 15 * 60 * 1000,
   });

   if (data?.data === null) return null;

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
         <p className="mb-3 text-sm font-medium">Watch Locations</p>
         {locations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
               No location data available
            </p>
         ) : (
            <div className="space-y-2">
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
      </div>
   );
};
