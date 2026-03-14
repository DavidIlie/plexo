"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
   Eye,
   Star,
   Clock,
   Calendar,
   Tv,
   Check,
   X,
   ChevronDown,
   ChevronUp,
   HardDrive,
   AlertTriangle,
} from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { formatDuration } from "date-fns";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { PlexImage } from "~/components/plex-image";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import type { PlexMediaItem } from "~/types/plex";

interface MediaDetailDialogProps {
   item: PlexMediaItem | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

const EpisodeGrid: React.FC<{ seasonKey: string; seasonTitle: string }> = ({
   seasonKey,
}) => {
   const trpc = useTRPC();
   const [expanded, setExpanded] = useState(false);
   const { data: episodesData } = useQuery({
      ...trpc.plex.getChildren.queryOptions({ ratingKey: seasonKey }),
      enabled: expanded,
   });

   const episodes = episodesData?.data ?? [];

   if (!expanded) {
      return (
         <button
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
         >
            <span>Show episodes</span>
            <ChevronDown className="h-3 w-3" />
         </button>
      );
   }

   if (episodes.length === 0) return null;

   const episodeNumbers = episodes.map((e) => e.index ?? 0);
   const maxEp = Math.max(...episodeNumbers);
   const haveSet = new Set(episodeNumbers);
   const missing: number[] = [];
   for (let i = 1; i <= maxEp; i++) {
      if (!haveSet.has(i)) missing.push(i);
   }

   return (
      <div className="space-y-2">
         <button
            onClick={() => setExpanded(false)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
         >
            <span>Hide episodes</span>
            <ChevronUp className="h-3 w-3" />
         </button>

         {missing.length > 0 && (
            <div className="flex items-start gap-1.5 rounded-md bg-yellow-500/10 px-2.5 py-1.5 text-xs text-yellow-500">
               <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
               <span>
                  Missing episode{missing.length > 1 ? "s" : ""}: {missing.join(", ")}
               </span>
            </div>
         )}

         <div className="space-y-0.5">
            {Array.from({ length: maxEp }, (_, i) => i + 1).map((epNum) => {
               const have = haveSet.has(epNum);
               const ep = episodes.find((e) => e.index === epNum);
               const watched = have && (ep?.viewCount ?? 0) > 0;
               const duration = ep?.duration
                  ? Math.round(ep.duration / 60000)
                  : null;
               const lastViewed =
                  ep?.lastViewedAt
                     ? formatDistanceToNow(
                          new Date(ep.lastViewedAt * 1000),
                          { addSuffix: true },
                       )
                     : null;

               if (!have) {
                  return (
                     <div
                        key={epNum}
                        className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground/40"
                     >
                        <span className="w-6 tabular-nums text-right">
                           {epNum}
                        </span>
                        <span className="italic">Missing</span>
                     </div>
                  );
               }

               return (
                  <div
                     key={epNum}
                     className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-xs",
                        watched
                           ? "text-muted-foreground"
                           : "text-foreground",
                     )}
                  >
                     <span className="w-6 shrink-0 tabular-nums text-right">
                        {epNum}
                     </span>
                     {watched ? (
                        <Check className="h-3 w-3 shrink-0 text-green-500" />
                     ) : (
                        <div className="h-3 w-3 shrink-0" />
                     )}
                     <span className="min-w-0 flex-1 truncate">
                        {ep?.title ?? `Episode ${epNum}`}
                     </span>
                     <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                        {duration && (
                           <span className="tabular-nums">{duration}m</span>
                        )}
                        {lastViewed && (
                           <span className="hidden sm:inline">
                              {lastViewed}
                           </span>
                        )}
                        {(ep?.viewCount ?? 0) > 1 && (
                           <span className="tabular-nums">
                              {ep?.viewCount}x
                           </span>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};

const SeasonBreakdown: React.FC<{ ratingKey: string }> = ({ ratingKey }) => {
   const trpc = useTRPC();
   const { data: seasonsData } = useQuery({
      ...trpc.plex.getChildren.queryOptions({ ratingKey }),
   });

   const seasons = seasonsData?.data ?? [];

   if (seasons.length === 0) return null;

   const realSeasons = seasons.filter(
      (s) => s.index !== undefined && s.index > 0,
   );

   return (
      <div className="space-y-3">
         <div className="flex items-center justify-between gap-2">
            <p className="shrink-0 text-xs font-medium text-muted-foreground">Seasons</p>
            <p className="truncate text-xs text-muted-foreground">
               {realSeasons.reduce((sum, s) => sum + (s.leafCount ?? 0), 0)} ep on disk
            </p>
         </div>
         <div className="space-y-2">
            {realSeasons.map((season) => {
               const watched = season.viewedLeafCount ?? 0;
               const total = season.leafCount ?? 0;
               const watchPct =
                  total > 0 ? Math.round((watched / total) * 100) : 0;

               return (
                  <div
                     key={season.ratingKey}
                     className="rounded-lg border border-border/50 bg-muted/20 p-3"
                  >
                     <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                           <span className="truncate text-sm font-medium">
                              {season.title}
                           </span>
                           {watchPct === 100 && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                           )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                           <span>{total} ep</span>
                           <span>{watched}/{total}</span>
                        </div>
                     </div>

                     {total > 0 && (
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                           <div
                              className={cn(
                                 "h-full rounded-full transition-all",
                                 watchPct === 100
                                    ? "bg-green-500"
                                    : watchPct > 0
                                      ? "bg-chart-1"
                                      : "bg-transparent",
                              )}
                              style={{ width: `${watchPct}%` }}
                           />
                        </div>
                     )}

                     <div className="mt-2">
                        <EpisodeGrid
                           seasonKey={season.ratingKey}
                           seasonTitle={season.title}
                        />
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};

const WatchHistorySection: React.FC<{ ratingKey: string }> = ({
   ratingKey,
}) => {
   const trpc = useTRPC();
   const { data } = useQuery({
      ...trpc.tautulli.getItemHistory.queryOptions({ ratingKey }),
   });

   const plays = data?.data ?? [];

   if (plays.length === 0) return null;

   const fmtDur = (secs: number) => {
      const mins = Math.round(secs / 60);
      if (mins < 60) return `${mins}m`;
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
   };

   return (
      <>
         <Separator />
         <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
               Watch History
            </p>
            <div className="space-y-1">
               {plays.slice(0, 10).map((play) => (
                  <div
                     key={play.row_id}
                     className="flex items-center justify-between rounded-md bg-muted/20 px-2.5 py-1.5 text-xs"
                  >
                     <div className="min-w-0 flex-1">
                        <p className="truncate">
                           {play.full_title}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                           <span>
                              {formatDistanceToNow(
                                 new Date(play.stopped * 1000),
                                 { addSuffix: true },
                              )}
                           </span>
                           {play.play_duration > 0 && (
                              <>
                                 <span className="text-border">·</span>
                                 <span>{fmtDur(play.play_duration)}</span>
                              </>
                           )}
                        </div>
                     </div>
                     <div className="flex shrink-0 items-center gap-2 pl-2 text-muted-foreground">
                        {play.platform && <span>{play.platform}</span>}
                        {play.player &&
                           play.player !== play.platform && (
                              <span>{play.player}</span>
                           )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </>
   );
};

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
         <DialogContent className="max-h-[85vh] overflow-y-scroll overscroll-contain p-0 sm:max-w-lg">
            {detail.art && (
               <div className="relative h-32 w-full overflow-hidden">
                  <PlexImage
                     path={detail.art}
                     alt=""
                     width={600}
                     height={200}
                     className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-popover to-transparent" />
               </div>
            )}

            <div className="min-w-0 space-y-4 overflow-hidden px-6 pb-6">
               <DialogHeader>
                  <DialogTitle className="text-lg">{detail.title}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                     {durationMinutes && (
                        <Badge variant="outline" className="text-xs">
                           <Clock className="mr-1 h-3 w-3" />
                           {Math.floor(durationMinutes / 60) > 0
                              ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                              : `${durationMinutes}m`}
                        </Badge>
                     )}
                  </div>
               </DialogHeader>

               {detail.Genre && detail.Genre.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                     {detail.Genre.map((g) => (
                        <Badge
                           key={g.tag}
                           variant="outline"
                           className="text-xs font-normal"
                        >
                           {g.tag}
                        </Badge>
                     ))}
                  </div>
               )}

               {detail.summary && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                     {detail.summary}
                  </p>
               )}

               <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {detail.rating && (
                     <div>
                        <p className="text-xs text-muted-foreground">
                           Critic Rating
                        </p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                           <Star className="h-3.5 w-3.5 text-yellow-500" />
                           {detail.rating}
                        </p>
                     </div>
                  )}
                  {detail.audienceRating && (
                     <div>
                        <p className="text-xs text-muted-foreground">
                           Audience
                        </p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                           <Star className="h-3.5 w-3.5 text-yellow-500" />
                           {detail.audienceRating}
                        </p>
                     </div>
                  )}
                  {(detail.viewCount ?? 0) > 0 && (
                     <div>
                        <p className="text-xs text-muted-foreground">Plays</p>
                        <p className="text-sm font-medium">
                           {detail.viewCount}
                        </p>
                     </div>
                  )}
                  {lastViewed && (
                     <div>
                        <p className="text-xs text-muted-foreground">
                           Last Watched
                        </p>
                        <p className="text-sm font-medium">{lastViewed}</p>
                     </div>
                  )}
                  {addedAt && (
                     <div>
                        <p className="text-xs text-muted-foreground">
                           Added to Library
                        </p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                           <Calendar className="h-3.5 w-3.5" />
                           {addedAt}
                        </p>
                     </div>
                  )}
                  {detail.studio && (
                     <div>
                        <p className="text-xs text-muted-foreground">Studio</p>
                        <p className="text-sm font-medium">{detail.studio}</p>
                     </div>
                  )}
                  {detail.type === "show" &&
                     detail.childCount !== undefined && (
                        <div>
                           <p className="text-xs text-muted-foreground">
                              Seasons
                           </p>
                           <p className="flex items-center gap-1 text-sm font-medium">
                              <Tv className="h-3.5 w-3.5" />
                              {detail.childCount}
                           </p>
                        </div>
                     )}
                  {detail.type === "show" &&
                     detail.leafCount !== undefined && (
                        <div>
                           <p className="text-xs text-muted-foreground">
                              Episodes on Disk
                           </p>
                           <p className="flex items-center gap-1 text-sm font-medium">
                              <HardDrive className="h-3.5 w-3.5" />
                              {detail.leafCount}
                           </p>
                        </div>
                     )}
               </div>

               {detail.Director && detail.Director.length > 0 && (
                  <div>
                     <p className="text-xs text-muted-foreground">Director</p>
                     <p className="text-sm">
                        {detail.Director.map((d) => d.tag).join(", ")}
                     </p>
                  </div>
               )}

               {detail.Role && detail.Role.length > 0 && (
                  <>
                     <Separator />
                     <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                           Cast
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {detail.Role.slice(0, 8).map((actor) => (
                              <div
                                 key={actor.tag}
                                 className="rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-sm"
                              >
                                 {actor.tag}
                              </div>
                           ))}
                        </div>
                     </div>
                  </>
               )}

               <WatchHistorySection ratingKey={detail.ratingKey} />

               {detail.type === "show" && (
                  <>
                     <Separator />
                     <SeasonBreakdown ratingKey={detail.ratingKey} />
                  </>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
};
