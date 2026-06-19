"use client";

import { MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { getLocationStatsCached } from "~/server/cache/analytics";

interface Props {
   data: Awaited<ReturnType<typeof getLocationStatsCached>>;
   lastUpdatedAt?: string;
}

export const LocationChart = ({ data, lastUpdatedAt }: Props) => {
   const locations = data;

   return (
      <div className="rounded-lg border border-border/50 p-4">
         <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-medium">Watch Locations</p>
         </div>
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
         {lastUpdatedAt && (
            <p className="mt-2 text-right text-[10px] text-muted-foreground/60">
               {`Updated ${formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}`}
            </p>
         )}
      </div>
   );
};
