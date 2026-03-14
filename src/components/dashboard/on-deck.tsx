"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { PlexImage } from "~/components/plex-image";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import type { PlexMediaItem, PlexOnDeckItem } from "~/types/plex";

const formatDuration = (ms: number) => {
   const totalSeconds = Math.floor(ms / 1000);
   const hours = Math.floor(totalSeconds / 3600);
   const minutes = Math.floor((totalSeconds % 3600) / 60);
   const seconds = totalSeconds % 60;
   if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
   }
   return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const OnDeck = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.plex.getOnDeck.queryOptions());
   const [selected, setSelected] = useState<PlexOnDeckItem | null>(null);

   const items = data?.data ?? [];

   if (items.length === 0) return null;

   return (
      <section>
         <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Up Next
         </h2>
         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((item) => (
               <div
                  key={item.ratingKey}
                  className="group cursor-pointer"
                  onClick={() => setSelected(item)}
               >
                  <div className="relative overflow-hidden rounded-md">
                     <PlexImage
                        path={item.grandparentThumb || item.thumb}
                        alt={item.title}
                        width={200}
                        height={300}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/10" />
                     {item.viewOffset != null && item.duration != null && item.duration > 0 && (
                        <>
                           <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                           <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 pb-2.5 text-[11px] font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <span>{formatDuration(item.viewOffset)}</span>
                              <span>{formatDuration(item.duration)}</span>
                           </div>
                           <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/60">
                              <div
                                 className="h-full bg-primary"
                                 style={{
                                    width: `${Math.min(
                                       100,
                                       Math.round(
                                          (item.viewOffset / item.duration) * 100,
                                       ),
                                    )}%`,
                                 }}
                              />
                           </div>
                        </>
                     )}
                  </div>
                  <p className="mt-1.5 truncate text-sm">
                     {item.grandparentTitle || item.title}
                  </p>
                  {item.grandparentTitle && (
                     <p className="truncate text-xs text-muted-foreground">
                        {item.parentTitle} &middot; {item.title}
                     </p>
                  )}
               </div>
            ))}
         </div>
         <MediaDetailDialog
            item={
               selected
                  ? {
                       ...selected,
                       ratingKey: selected.grandparentRatingKey ?? selected.ratingKey,
                    }
                  : null
            }
            open={!!selected}
            onOpenChange={(open) => {
               if (!open) setSelected(null);
            }}
         />
      </section>
   );
};
