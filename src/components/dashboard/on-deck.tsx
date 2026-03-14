"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { PlexImage } from "~/components/plex-image";

export const OnDeck = () => {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.plex.getOnDeck.queryOptions());

   const items = data?.data ?? [];

   if (items.length === 0) return null;

   return (
      <section>
         <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Up Next
         </h2>
         <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((item) => (
               <div key={item.ratingKey}>
                  <PlexImage
                     path={item.grandparentThumb || item.thumb}
                     alt={item.title}
                     width={200}
                     height={300}
                     className="w-full rounded-md object-cover"
                  />
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
      </section>
   );
};
