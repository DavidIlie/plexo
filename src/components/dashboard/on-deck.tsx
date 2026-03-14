"use client";

import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PlexImage } from "~/components/plex-image";
import { Skeleton } from "~/components/ui/skeleton";

export const OnDeck = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(trpc.plex.getOnDeck.queryOptions());

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Continue Watching
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                     <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
                  ))}
               </div>
            </CardContent>
         </Card>
      );
   }

   const items = data?.data ?? [];

   if (items.length === 0) return null;

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Play className="h-5 w-5" />
               Continue Watching
            </CardTitle>
         </CardHeader>
         <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
               {items.map((item) => (
                  <div key={item.ratingKey} className="group relative">
                     <PlexImage
                        path={item.grandparentThumb || item.thumb}
                        alt={item.title}
                        width={200}
                        height={300}
                        className="w-full rounded-lg object-cover transition-opacity group-hover:opacity-80"
                     />
                     <div className="mt-2">
                        <p className="truncate text-sm font-medium">
                           {item.grandparentTitle || item.title}
                        </p>
                        {item.grandparentTitle && (
                           <p className="truncate text-xs text-muted-foreground">
                              {item.parentTitle} &middot; {item.title}
                           </p>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
};
