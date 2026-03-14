"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Film, Tv, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useTRPC } from "~/trpc/react";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { PlexImage } from "~/components/plex-image";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import { Skeleton } from "~/components/ui/skeleton";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "~/components/ui/select";
import type { PlexMediaItem } from "~/types/plex";

const formatDuration = (seconds: number) => {
   const mins = Math.round(seconds / 60);
   if (mins < 60) return `${mins}m`;
   return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const mediaTypeIcon = (type: string) => {
   if (type === "track") return <Music className="h-3.5 w-3.5 text-primary/60" />;
   if (type === "episode" || type === "show") return <Tv className="h-3.5 w-3.5 text-primary/60" />;
   return <Film className="h-3.5 w-3.5 text-primary/60" />;
};

const mediaTypeLabel = (type: string) => {
   if (type === "track") return "Track";
   if (type === "episode") return "Episode";
   if (type === "movie") return "Movie";
   return type;
};

const ActivityPage = () => {
   const trpc = useTRPC();
   const router = useRouter();
   const [mediaType, setMediaType] = useState("all");
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(null);

   const {
      data,
      isLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
   } = useInfiniteQuery(
      trpc.tautulli.browseHistory.infiniteQueryOptions(
         { ...(mediaType !== "all" ? { mediaType } : {}) },
         {
            initialCursor: 0,
            getNextPageParam: (lastPage) => lastPage.nextCursor,
         },
      ),
   );

   const items = useMemo(
      () => data?.pages.flatMap((p) => p.items) ?? [],
      [data],
   );

   const loadMore = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
         void fetchNextPage();
      }
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage);

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
               >
                  <ArrowLeft className="h-4 w-4" />
               </Link>
               <h1 className="text-lg font-semibold">Activity</h1>
            </div>
            <Select value={mediaType} onValueChange={setMediaType}>
               <SelectTrigger className="w-[150px]">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="episode">TV Episodes</SelectItem>
                  <SelectItem value="track">Music</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {isLoading ? (
            <div className="space-y-2">
               {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
               ))}
            </div>
         ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
               No activity found
            </p>
         ) : (
            <>
               <div className="space-y-0.5">
                  {items.map((item) => {
                     const isTrack = item.media_type === "track";
                     return (
                        <div
                           key={item.row_id}
                           className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                           onClick={() => {
                              if (isTrack) {
                                 const artistKey = String(item.grandparent_rating_key || item.rating_key);
                                 router.push(`/music/${artistKey}`);
                                 return;
                              }
                              setSelectedItem({
                                 ratingKey: String(
                                    item.grandparent_rating_key || item.rating_key,
                                 ),
                                 key: "",
                                 type:
                                    item.media_type === "episode"
                                       ? "show"
                                       : item.media_type,
                                 title: item.grandparent_title || item.title,
                                 addedAt: 0,
                              });
                           }}
                        >
                           <PlexImage
                              path={
                                 item.grandparent_thumb ||
                                 item.parent_thumb ||
                                 item.thumb
                              }
                              alt={item.full_title}
                              width={40}
                              height={60}
                              className="h-14 w-9 shrink-0 rounded object-cover"
                           />
                           <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                 {mediaTypeIcon(item.media_type)}
                                 <p className="truncate text-sm font-medium">
                                    {item.full_title}
                                 </p>
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                 <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                    {mediaTypeLabel(item.media_type)}
                                 </span>
                                 <span>
                                    {format(new Date(item.stopped * 1000), "MMM d, yyyy · h:mm a")}
                                 </span>
                                 <span className="text-border">·</span>
                                 <span>
                                    {formatDistanceToNow(
                                       new Date(item.stopped * 1000),
                                       { addSuffix: true },
                                    )}
                                 </span>
                                 {item.play_duration > 0 && (
                                    <>
                                       <span className="text-border">·</span>
                                       <span>{formatDuration(item.play_duration)}</span>
                                    </>
                                 )}
                                 {item.platform && (
                                    <>
                                       <span className="text-border">·</span>
                                       <span>{item.platform}</span>
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
               <div ref={sentinelRef} className="h-1" />
               {isFetchingNextPage && (
                  <div className="space-y-2">
                     {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-md" />
                     ))}
                  </div>
               )}
            </>
         )}

         <MediaDetailDialog
            item={selectedItem}
            open={!!selectedItem}
            onOpenChange={(v) => {
               if (!v) setSelectedItem(null);
            }}
         />
      </div>
   );
};
export default ActivityPage;
