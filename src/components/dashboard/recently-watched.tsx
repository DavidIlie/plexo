"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PlexImage } from "~/components/plex-image";
import { Skeleton } from "~/components/ui/skeleton";

export const RecentlyWatched = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.tautulli.getHistory.queryOptions({ length: 10 }),
   );

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recently Watched
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
               ))}
            </CardContent>
         </Card>
      );
   }

   const items = data?.data.data ?? [];

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Clock className="h-5 w-5" />
               Recently Watched
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
            {items.map((item) => (
               <div
                  key={item.row_id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
               >
                  <PlexImage
                     path={
                        item.grandparent_thumb || item.parent_thumb || item.thumb
                     }
                     alt={item.full_title}
                     width={40}
                     height={60}
                     className="rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                     <p className="truncate text-sm font-medium">
                        {item.full_title}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        {item.friendly_name} &middot;{" "}
                        {formatDistanceToNow(new Date(item.stopped * 1000), {
                           addSuffix: true,
                        })}
                     </p>
                  </div>
               </div>
            ))}
            {items.length === 0 && (
               <p className="text-center text-sm text-muted-foreground">
                  No recent watch history
               </p>
            )}
         </CardContent>
      </Card>
   );
};
