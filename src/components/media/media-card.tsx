"use client";

import { Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { PlexImage } from "~/components/plex-image";
import { WatchProgress } from "./watch-progress";
import { cn } from "~/lib/utils";
import type { PlexMediaItem } from "~/types/plex";

interface MediaCardProps {
   item: PlexMediaItem;
   showProgress?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
   item,
   showProgress = false,
}) => {
   const isWatched =
      item.type === "movie"
         ? (item.viewCount ?? 0) > 0
         : item.leafCount !== undefined &&
           item.viewedLeafCount !== undefined &&
           item.viewedLeafCount >= item.leafCount;

   const genres = item.Genre?.slice(0, 2) ?? [];
   const durationMinutes = item.duration
      ? Math.round(item.duration / 60000)
      : null;

   return (
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/30">
         <div className="relative aspect-[2/3] overflow-hidden">
            <PlexImage
               path={item.thumb}
               alt={item.title}
               width={300}
               height={450}
               className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {isWatched && (
               <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                  <Check className="h-3 w-3 text-white" />
               </div>
            )}
         </div>
         <div className="space-y-2 p-3">
            <h3 className="truncate text-sm font-medium">{item.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               {item.year && <span>{item.year}</span>}
               {durationMinutes && item.type === "movie" && (
                  <span>{durationMinutes}m</span>
               )}
               {item.childCount !== undefined && item.type === "show" && (
                  <span>
                     {item.childCount} season{item.childCount !== 1 ? "s" : ""}
                  </span>
               )}
            </div>
            {genres.length > 0 && (
               <div className="flex flex-wrap gap-1">
                  {genres.map((genre) => (
                     <Badge
                        key={genre.tag}
                        variant="secondary"
                        className={cn("text-xs")}
                     >
                        {genre.tag}
                     </Badge>
                  ))}
               </div>
            )}
            {showProgress &&
               item.leafCount !== undefined &&
               item.viewedLeafCount !== undefined && (
                  <WatchProgress
                     viewed={item.viewedLeafCount}
                     total={item.leafCount}
                  />
               )}
         </div>
      </div>
   );
};
