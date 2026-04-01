"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Film, Tv, Music, MapPin } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { useAppConfig } from "~/components/app-config-provider";
import { PlexImage } from "~/components/plex-image";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import type { PlexMediaItem } from "~/types/plex";

const formatDuration = (seconds: number) => {
   const mins = Math.round(seconds / 60);
   if (mins < 60) return `${mins}m`;
   return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const mediaTypeIcon = (type: string) => {
   if (type === "track") return <Music className="h-3 w-3" />;
   if (type === "episode" || type === "show") return <Tv className="h-3 w-3" />;
   return <Film className="h-3 w-3" />;
};

export const RecentlyWatched = () => {
   const trpc = useTRPC();
   const router = useRouter();
   const { musicEnabled, locationsEnabled } = useAppConfig();
   const { data } = useSuspenseQuery({
      ...trpc.tautulli.getHistory.queryOptions({ length: 10 }),
      refetchInterval: 5 * 60 * 1000,
   });
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(null);

   const items = data?.data.data ?? [];

   const ipAddresses = useMemo(
      () => items.map((item) => item.ip_address),
      [items],
   );

   const { data: locationData } = useQuery({
      ...trpc.tautulli.resolveLocations.queryOptions({ ipAddresses }),
      enabled: locationsEnabled && ipAddresses.length > 0,
      staleTime: 60 * 60 * 1000,
   });

   const locations = locationData?.data ?? {};

   if (items.length === 0) return null;

   return (
      <section>
         <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
               {musicEnabled ? "Recent Activity" : "Recently Watched"}
            </h2>
            <Link
               href="/activity"
               className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
               View all
               <ArrowRight className="h-3 w-3" />
            </Link>
         </div>
         <div className="space-y-0.5">
            {items.map((item) => {
               const isTrack = item.media_type === "track";
               return (
                  <div
                     key={item.row_id}
                     className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
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
                        width={36}
                        height={54}
                        className="shrink-0 rounded object-cover"
                     />
                     <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{item.full_title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                           <span className="flex items-center gap-1">
                              {mediaTypeIcon(item.media_type)}
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
                           {item.player && item.player !== item.platform && (
                              <>
                                 <span className="text-border">·</span>
                                 <span>{item.player}</span>
                              </>
                           )}
                           {locationsEnabled && locations[item.ip_address] && (
                              <>
                                 <span className="text-border">·</span>
                                 <span className="flex items-center gap-0.5">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {locations[item.ip_address]}
                                 </span>
                              </>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
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
