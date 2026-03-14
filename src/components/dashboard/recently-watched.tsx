"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { useTRPC } from "~/trpc/react";
import { PlexImage } from "~/components/plex-image";

export const RecentlyWatched = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.tautulli.getHistory.queryOptions({ length: 10 }),
   );

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
                  className="flex items-center gap-3 rounded-md px-2 py-1.5"
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
      </section>
   );
};
