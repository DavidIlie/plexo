"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Eye, Star, Clock, Calendar, Tv, Check, X } from "lucide-react";

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
import { cn } from "~/lib/utils";
import type { PlexMediaItem } from "~/types/plex";

interface MediaDetailDialogProps {
   item: PlexMediaItem | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

const SeasonBreakdown: React.FC<{ ratingKey: string }> = ({ ratingKey }) => {
   const trpc = useTRPC();
   const { data: seasonsData } = useQuery({
      ...trpc.plex.getChildren.queryOptions({ ratingKey }),
   });

   const seasons = seasonsData?.data ?? [];

   if (seasons.length === 0) return null;

   return (
      <div className="space-y-2">
         <p className="text-xs font-medium text-muted-foreground">Seasons</p>
         <div className="space-y-1.5">
            {seasons
               .filter((s) => s.index !== undefined && s.index > 0)
               .map((season) => {
                  const watched = season.viewedLeafCount ?? 0;
                  const total = season.leafCount ?? 0;
                  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

                  return (
                     <div key={season.ratingKey} className="rounded-md bg-muted/30 px-3 py-2">
                        <div className="flex items-center justify-between">
                           <span className="text-sm">{season.title}</span>
                           <div className="flex items-center gap-1.5">
                              {pct === 100 ? (
                                 <Check className="h-3 w-3 text-green-500" />
                              ) : pct === 0 ? (
                                 <X className="h-3 w-3 text-muted-foreground" />
                              ) : null}
                              <span className="tabular-nums text-xs text-muted-foreground">
                                 {watched}/{total}
                              </span>
                           </div>
                        </div>
                        {total > 0 && (
                           <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                 className={cn(
                                    "h-full rounded-full transition-all",
                                    pct === 100 ? "bg-green-500" : "bg-chart-1",
                                 )}
                                 style={{ width: `${pct}%` }}
                              />
                           </div>
                        )}
                     </div>
                  );
               })}
         </div>
      </div>
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
      ? formatDistanceToNow(new Date(detail.lastViewedAt * 1000), { addSuffix: true })
      : null;

   const addedAt = detail.addedAt
      ? formatDistanceToNow(new Date(detail.addedAt * 1000), { addSuffix: true })
      : null;

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-lg">
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

            <div className="space-y-4 px-6 pb-6">
               <DialogHeader>
                  <DialogTitle className="text-lg">{detail.title}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                     {detail.year && (
                        <Badge variant="secondary" className="text-xs">{detail.year}</Badge>
                     )}
                     {detail.contentRating && (
                        <Badge variant="secondary" className="text-xs">{detail.contentRating}</Badge>
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
                        <Badge key={g.tag} variant="outline" className="text-xs font-normal">
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
                        <p className="text-xs text-muted-foreground">Critic Rating</p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                           <Star className="h-3.5 w-3.5 text-yellow-500" />
                           {detail.rating}
                        </p>
                     </div>
                  )}
                  {detail.audienceRating && (
                     <div>
                        <p className="text-xs text-muted-foreground">Audience</p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                           <Star className="h-3.5 w-3.5 text-yellow-500" />
                           {detail.audienceRating}
                        </p>
                     </div>
                  )}
                  {(detail.viewCount ?? 0) > 0 && (
                     <div>
                        <p className="text-xs text-muted-foreground">Plays</p>
                        <p className="text-sm font-medium">{detail.viewCount}</p>
                     </div>
                  )}
                  {lastViewed && (
                     <div>
                        <p className="text-xs text-muted-foreground">Last Watched</p>
                        <p className="text-sm font-medium">{lastViewed}</p>
                     </div>
                  )}
                  {addedAt && (
                     <div>
                        <p className="text-xs text-muted-foreground">Added to Library</p>
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
                  {detail.type === "show" && detail.childCount !== undefined && (
                     <div>
                        <p className="text-xs text-muted-foreground">Seasons</p>
                        <p className="flex items-center gap-1 text-sm font-medium">
                           <Tv className="h-3.5 w-3.5" />
                           {detail.childCount}
                        </p>
                     </div>
                  )}
                  {detail.type === "show" && detail.leafCount !== undefined && (
                     <div>
                        <p className="text-xs text-muted-foreground">Total Episodes</p>
                        <p className="text-sm font-medium">{detail.leafCount}</p>
                     </div>
                  )}
               </div>

               {detail.Director && detail.Director.length > 0 && (
                  <div>
                     <p className="text-xs text-muted-foreground">Director</p>
                     <p className="text-sm">{detail.Director.map((d) => d.tag).join(", ")}</p>
                  </div>
               )}

               {detail.Role && detail.Role.length > 0 && (
                  <>
                     <Separator />
                     <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Cast</p>
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
