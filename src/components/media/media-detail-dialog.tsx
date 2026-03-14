"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Eye, Star, Clock, Calendar, Film, Tv } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { PlexImage } from "~/components/plex-image";
import { Separator } from "~/components/ui/separator";
import type { PlexMediaItem } from "~/types/plex";

interface MediaDetailDialogProps {
   item: PlexMediaItem | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export const MediaDetailDialog: React.FC<MediaDetailDialogProps> = ({
   item,
   open,
   onOpenChange,
}) => {
   const trpc = useTRPC();
   const { data: metadata } = useQuery({
      ...trpc.plex.getMetadata.queryOptions({
         ratingKey: item?.ratingKey ?? "",
      }),
      enabled: open && !!item,
   });

   const detail = metadata?.data ?? item;

   if (!detail) return null;

   const isWatched =
      detail.type === "movie"
         ? (detail.viewCount ?? 0) > 0
         : detail.leafCount !== undefined &&
           detail.viewedLeafCount !== undefined &&
           detail.viewedLeafCount >= detail.leafCount;

   const durationMinutes = detail.duration
      ? Math.round(detail.duration / 60000)
      : null;

   const lastViewed = detail.lastViewedAt
      ? formatDistanceToNow(new Date(detail.lastViewedAt * 1000), {
           addSuffix: true,
        })
      : null;

   const addedAt = detail.addedAt
      ? formatDistanceToNow(new Date(detail.addedAt * 1000), {
           addSuffix: true,
        })
      : null;

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
               <DialogTitle className="text-base">{detail.title}</DialogTitle>
            </DialogHeader>

            <div className="flex gap-4">
               <PlexImage
                  path={detail.thumb}
                  alt={detail.title}
                  width={120}
                  height={180}
                  className="shrink-0 rounded-md object-cover"
               />
               <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                     {detail.year && (
                        <Badge variant="secondary" className="text-xs">
                           {detail.year}
                        </Badge>
                     )}
                     {detail.contentRating && (
                        <Badge variant="secondary" className="text-xs">
                           {detail.contentRating}
                        </Badge>
                     )}
                     {isWatched && (
                        <Badge variant="secondary" className="text-xs">
                           <Eye className="mr-1 h-3 w-3" />
                           Watched
                        </Badge>
                     )}
                  </div>

                  {detail.Genre && detail.Genre.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                        {detail.Genre.map((g) => (
                           <Badge key={g.tag} variant="outline" className="text-xs">
                              {g.tag}
                           </Badge>
                        ))}
                     </div>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground">
                     {durationMinutes && (
                        <div className="flex items-center gap-1.5">
                           <Clock className="h-3 w-3" />
                           {Math.floor(durationMinutes / 60) > 0
                              ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                              : `${durationMinutes}m`}
                        </div>
                     )}
                     {detail.type === "show" && detail.childCount !== undefined && (
                        <div className="flex items-center gap-1.5">
                           <Tv className="h-3 w-3" />
                           {detail.childCount} season{detail.childCount !== 1 ? "s" : ""}
                           {detail.leafCount !== undefined &&
                              ` · ${detail.leafCount} episodes`}
                        </div>
                     )}
                     {detail.type === "show" &&
                        detail.viewedLeafCount !== undefined &&
                        detail.leafCount !== undefined && (
                           <div className="flex items-center gap-1.5">
                              <Eye className="h-3 w-3" />
                              {detail.viewedLeafCount}/{detail.leafCount} episodes watched
                           </div>
                        )}
                     {(detail.viewCount ?? 0) > 1 && (
                        <div className="flex items-center gap-1.5">
                           <Film className="h-3 w-3" />
                           Watched {detail.viewCount} times
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {detail.summary && (
               <>
                  <Separator />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                     {detail.summary}
                  </p>
               </>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-xs">
               {detail.rating && (
                  <div>
                     <span className="text-muted-foreground">Rating</span>
                     <p className="flex items-center gap-1 font-medium">
                        <Star className="h-3 w-3" />
                        {detail.rating}/10
                     </p>
                  </div>
               )}
               {detail.audienceRating && (
                  <div>
                     <span className="text-muted-foreground">Audience</span>
                     <p className="flex items-center gap-1 font-medium">
                        <Star className="h-3 w-3" />
                        {detail.audienceRating}/10
                     </p>
                  </div>
               )}
               {lastViewed && (
                  <div>
                     <span className="text-muted-foreground">Last watched</span>
                     <p className="font-medium">{lastViewed}</p>
                  </div>
               )}
               {addedAt && (
                  <div>
                     <span className="text-muted-foreground">Added</span>
                     <p className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" />
                        {addedAt}
                     </p>
                  </div>
               )}
               {detail.studio && (
                  <div>
                     <span className="text-muted-foreground">Studio</span>
                     <p className="font-medium">{detail.studio}</p>
                  </div>
               )}
               {detail.Director && detail.Director.length > 0 && (
                  <div>
                     <span className="text-muted-foreground">Director</span>
                     <p className="font-medium">
                        {detail.Director.map((d) => d.tag).join(", ")}
                     </p>
                  </div>
               )}
            </div>

            {detail.Role && detail.Role.length > 0 && (
               <>
                  <Separator />
                  <div>
                     <span className="text-xs text-muted-foreground">Cast</span>
                     <p className="mt-0.5 text-sm">
                        {detail.Role.slice(0, 6)
                           .map((r) => r.tag)
                           .join(", ")}
                     </p>
                  </div>
               </>
            )}
         </DialogContent>
      </Dialog>
   );
};
