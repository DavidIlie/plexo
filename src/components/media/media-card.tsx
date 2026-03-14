"use client";

import { Eye } from "lucide-react";
import { PlexImage } from "~/components/plex-image";
import { WatchProgress } from "./watch-progress";
import { cn } from "~/lib/utils";
import type { PlexMediaItem } from "~/types/plex";

interface MediaCardProps {
   item: PlexMediaItem;
   showProgress?: boolean;
   onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
   item,
   showProgress = false,
   onClick,
}) => {
   const isWatched =
      item.type === "movie"
         ? (item.viewCount ?? 0) > 0
         : item.leafCount !== undefined &&
           item.viewedLeafCount !== undefined &&
           item.viewedLeafCount >= item.leafCount;

   const isPartial =
      item.type === "show" &&
      (item.viewedLeafCount ?? 0) > 0 &&
      !isWatched;

   const durationMinutes = item.duration
      ? Math.round(item.duration / 60000)
      : null;

   return (
      <div className="group cursor-pointer" onClick={onClick}>
         <div className="relative aspect-[2/3] overflow-hidden rounded-md">
            <PlexImage
               path={item.thumb}
               alt={item.title}
               width={300}
               height={450}
               className={cn(
                  "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
                  isWatched && "opacity-50",
               )}
            />
            {isWatched && (
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-background/80 p-2">
                     <Eye className="h-4 w-4 text-foreground" />
                  </div>
               </div>
            )}
            {isPartial && (
               <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div
                     className="h-full bg-primary"
                     style={{
                        width: `${Math.round(((item.viewedLeafCount ?? 0) / (item.leafCount ?? 1)) * 100)}%`,
                     }}
                  />
               </div>
            )}
            {!isWatched && !isPartial && item.type !== "artist" && (
               <div className="absolute left-1.5 top-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
               </div>
            )}
         </div>
         <div className="mt-1.5">
            <p className={cn("truncate text-sm", isWatched && "text-muted-foreground")}>
               {item.title}
            </p>
            <p className="text-xs text-muted-foreground">
               {[
                  item.year,
                  durationMinutes && item.type === "movie" ? `${durationMinutes}m` : null,
                  item.childCount !== undefined && item.type === "show"
                     ? `${item.childCount}S`
                     : null,
                  item.childCount !== undefined && item.type === "artist"
                     ? `${item.childCount} albums`
                     : null,
                  item.Media?.[0]?.videoResolution
                     ? item.Media[0].videoResolution === "4k"
                        ? "4K"
                        : `${item.Media[0].videoResolution}p`
                     : null,
                  item.Genre?.[0]?.tag,
               ]
                  .filter(Boolean)
                  .join(" · ")}
            </p>
            {showProgress &&
               item.leafCount !== undefined &&
               item.viewedLeafCount !== undefined && (
                  <WatchProgress
                     viewed={item.viewedLeafCount}
                     total={item.leafCount}
                     className="mt-1"
                  />
               )}
         </div>
      </div>
   );
};
