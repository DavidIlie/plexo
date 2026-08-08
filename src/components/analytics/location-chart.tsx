"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { getLocationStatsCached } from "~/server/cache/analytics";

interface Props {
   data: Awaited<ReturnType<typeof getLocationStatsCached>>;
   lastUpdatedAt?: string;
}

export const LocationChart = ({ data, lastUpdatedAt }: Props) => {
   const locations = data;
   const maxCount = locations.reduce((max, loc) => Math.max(max, loc.count), 0);

   return (
      <motion.div
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35 }}
         className="rounded-lg border border-border/50 bg-card/50 p-4"
      >
         <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-medium">Watch Locations</p>
         </div>
         {locations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
               No location data available
            </p>
         ) : (
            <div className="space-y-2">
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
                        <motion.div
                           initial={{ width: 0 }}
                           animate={{
                              width: `${maxCount > 0 ? (loc.count / maxCount) * 100 : 0}%`,
                           }}
                           transition={{
                              duration: 0.5,
                              delay: 0.15 + index * 0.04,
                              ease: [0.23, 1, 0.32, 1],
                           }}
                           className="h-full rounded-full bg-primary"
                        />
                     </div>
                  </motion.div>
               ))}
            </div>
         )}
         {lastUpdatedAt && (
            <p className="mt-2 text-right text-[10px] text-muted-foreground/60">
               {`Updated ${formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}`}
            </p>
         )}
      </motion.div>
   );
};
