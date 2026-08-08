"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

import type { getLocationStatsCached } from "~/server/cache/analytics";
import { ChartCard } from "~/components/analytics/chart-wrapper";

interface Props {
   data: Awaited<ReturnType<typeof getLocationStatsCached>>;
   lastUpdatedAt?: string;
}

export const LocationChart = ({ data, lastUpdatedAt }: Props) => {
   const locations = data;
   const maxCount = locations.reduce((max, loc) => Math.max(max, loc.count), 0);

   return (
      <ChartCard title="Watch Locations" lastUpdatedAt={lastUpdatedAt}>
         {locations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
               No location data available
            </p>
         ) : (
            <div className="mt-2 space-y-2">
               {locations.map((loc, index) => (
                  <motion.div
                     key={loc.location}
                     initial={{ opacity: 0, y: 8 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.25, delay: index * 0.04 }}
                     className="rounded-md bg-muted/30 px-3 py-2"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                           <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                           <span className="truncate text-sm">{loc.location}</span>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                           {loc.count} {loc.count !== 1 ? "entries" : "entry"}
                        </span>
                     </div>
                     <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        {/* Bar is laid out at its final width; the reveal
                            animates scaleX only (compositor-friendly). */}
                        <motion.div
                           initial={{ scaleX: 0 }}
                           animate={{ scaleX: 1 }}
                           transition={{
                              duration: 0.5,
                              delay: 0.15 + index * 0.04,
                              ease: [0.23, 1, 0.32, 1],
                           }}
                           style={{
                              width: `${maxCount > 0 ? (loc.count / maxCount) * 100 : 0}%`,
                           }}
                           className="h-full origin-left rounded-full bg-primary"
                        />
                     </div>
                  </motion.div>
               ))}
            </div>
         )}
      </ChartCard>
   );
};
