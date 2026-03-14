"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { useTRPC } from "~/trpc/react";
import { PlexImage } from "~/components/plex-image";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import type { PlexMediaItem } from "~/types/plex";

export const RecentlyWatched = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.tautulli.getHistory.queryOptions({ length: 10 }),
   );
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(null);

   const items = data?.data.data ?? [];

   if (items.length === 0) return null;

   return (
      <section>
         <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recently Watched
         </h2>
         <div className="space-y-1">
            {items.map((item) => (
               <div
                  key={item.row_id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                  onClick={() =>
                     setSelectedItem({
                        ratingKey: String(
                           item.grandparent_rating_key || item.rating_key,
                        ),
                        key: "",
                        type:
                           item.media_type === "episode" ? "show" : item.media_type,
                        title: item.grandparent_title || item.title,
                        addedAt: 0,
                     })
                  }
               >
                  <PlexImage
                     path={
                        item.grandparent_thumb || item.parent_thumb || item.thumb
                     }
                     alt={item.full_title}
                     width={32}
                     height={48}
                     className="rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                     <p className="truncate text-sm">{item.full_title}</p>
                     <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.stopped * 1000), {
                           addSuffix: true,
                        })}
                     </p>
                  </div>
               </div>
            ))}
         </div>

         <MediaDetailDialog
            item={selectedItem}
            open={!!selectedItem}
            onOpenChange={(v) => {
               if (!v) setSelectedItem(null);
            }}
         />
      </section>
   );
};
