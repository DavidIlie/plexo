import Link from "next/link";
import { ArrowLeft, Clock3, Eye, Film, Star, Tv } from "lucide-react";

import { DossierEpisodeMap } from "~/components/media/dossier-episode-map";
import type { DossierSeason } from "~/components/media/dossier-episode-map";
import { DossierLedger } from "~/components/media/dossier-ledger";
import { DossierPlayLog } from "~/components/media/dossier-play-log";
import { DossierTimelineChartLazy } from "~/components/analytics/lazy-charts";
import { PlexImage } from "~/components/plex-image";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatPlexDuration } from "~/lib/duration";
import type { MediaDossier as MediaDossierData } from "~/types/dossier";
import type { PlexMediaItem } from "~/types/plex";

interface Props {
   item: PlexMediaItem;
   dossier: MediaDossierData;
   seasons: DossierSeason[];
}

export const MediaDossier: React.FC<Props> = ({ item, dossier, seasons }) => {
   const isShow = item.type === "show";
   const episodesOnDisk = seasons.reduce(
      (total, season) => total + season.episodeCount,
      0,
   );
   const libraryHref = isShow ? "/tv" : "/movies";
   const libraryLabel = isShow ? "TV Shows" : "Movies";
   const Icon = isShow ? Tv : Film;

   return (
      <article className="space-y-6">
         <Button asChild variant="ghost" size="sm" className="-ml-3 h-8">
            <Link href={libraryHref}>
               <ArrowLeft />
               Back to {libraryLabel}
            </Link>
         </Button>

         <header className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40">
            {item.art && (
               <>
                  <PlexImage
                     path={item.art}
                     alt=""
                     width={1280}
                     height={480}
                     priority
                     className="absolute inset-0 h-full w-full rounded-none opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
               </>
            )}

            <div className="relative grid gap-5 p-5 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-end sm:p-7">
               <PlexImage
                  path={item.thumb}
                  alt={`${item.title} poster`}
                  width={256}
                  height={384}
                  priority
                  className="hidden aspect-[2/3] w-32 rounded-lg border border-border/50 shadow-lg sm:block"
               />

               <div className="min-w-0 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                     <Icon className="h-3.5 w-3.5" />
                     {isShow ? "TV dossier" : "Movie dossier"}
                  </div>
                  <div>
                     <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {item.title}
                     </h1>
                     <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.year && (
                           <Badge variant="secondary">{item.year}</Badge>
                        )}
                        {item.contentRating && (
                           <Badge variant="secondary">
                              {item.contentRating}
                           </Badge>
                        )}
                        {item.duration && !isShow && (
                           <Badge variant="outline" className="gap-1">
                              <Clock3 className="h-3 w-3" />
                              {formatPlexDuration(item.duration)}
                           </Badge>
                        )}
                        {item.audienceRating && (
                           <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {item.audienceRating}
                           </Badge>
                        )}
                        {dossier.totalPlays > 0 && (
                           <Badge variant="outline" className="gap-1">
                              <Eye className="h-3 w-3" />
                              Watched
                           </Badge>
                        )}
                     </div>
                  </div>

                  {item.Genre && item.Genre.length > 0 && (
                     <p className="text-xs text-muted-foreground">
                        {item.Genre.map((genre) => genre.tag).join(" · ")}
                     </p>
                  )}
                  {item.summary && (
                     <p className="max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
                        {item.summary}
                     </p>
                  )}
               </div>
            </div>
         </header>

         <DossierLedger
            dossier={dossier}
            isShow={isShow}
            episodesOnDisk={episodesOnDisk}
         />

         <section aria-label="Viewing trends">
            <DossierTimelineChartLazy
               buckets={dossier.buckets}
               bucketUnit={dossier.bucketUnit}
               showEpisodeProgress={isShow}
               totalPlays={dossier.totalPlays}
            />
         </section>

         {isShow && (
            <DossierEpisodeMap seasons={seasons} episodes={dossier.episodes} />
         )}

         <DossierPlayLog
            plays={dossier.plays}
            truncated={dossier.playsTruncated}
         />
      </article>
   );
};
