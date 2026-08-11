import { cn } from "~/lib/utils";
import type { DossierEpisodeStat } from "~/types/dossier";

export interface DossierSeason {
   index: number;
   title: string;
   episodeCount: number;
}

interface Props {
   seasons: DossierSeason[];
   episodes: DossierEpisodeStat[];
}

const tileClass = (plays: number) => {
   if (plays === 0) {
      return "border border-dashed border-border/60 bg-transparent text-muted-foreground/40";
   }
   if (plays === 1) return "bg-chart-1/40 text-foreground";
   return "bg-chart-1 text-background";
};

export const DossierEpisodeMap: React.FC<Props> = ({ seasons, episodes }) => {
   const playsByKey = new Map<string, DossierEpisodeStat>();
   for (const episode of episodes) {
      playsByKey.set(`${episode.season}:${episode.episode}`, episode);
   }

   const rows = seasons
      .map((season) => {
         const watchedMax = episodes
            .filter((episode) => episode.season === season.index)
            .reduce((max, episode) => Math.max(max, episode.episode), 0);
         return { ...season, count: Math.max(season.episodeCount, watchedMax) };
      })
      .filter((season) => season.count > 0);

   if (rows.length === 0) return null;

   return (
      <section
         aria-labelledby="episode-map-heading"
         className="space-y-4 rounded-lg border border-border/50 bg-card/50 p-4"
      >
         <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
               <h2 id="episode-map-heading" className="text-sm font-medium">
                  Episode map
               </h2>
               <p className="text-xs text-muted-foreground">
                  Every episode on disk, shaded by how often it was played
               </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
               <span className="flex items-center gap-1.5">
                  <span
                     aria-hidden
                     className="h-3 w-3 rounded-[3px] border border-dashed border-border/60"
                  />
                  Unwatched
               </span>
               <span className="flex items-center gap-1.5">
                  <span
                     aria-hidden
                     className="h-3 w-3 rounded-[3px] bg-chart-1/40"
                  />
                  Watched
               </span>
               <span className="flex items-center gap-1.5">
                  <span
                     aria-hidden
                     className="h-3 w-3 rounded-[3px] bg-chart-1"
                  />
                  Rewatched
               </span>
            </div>
         </div>

         <div className="space-y-3">
            {rows.map((season) => {
               const seen = Array.from(
                  { length: season.count },
                  (_, index) =>
                     playsByKey.get(`${season.index}:${index + 1}`),
               );
               const watched = seen.filter(Boolean).length;

               return (
                  <div key={season.index} className="space-y-1.5">
                     <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-xs font-medium">
                           {season.title}
                        </p>
                        <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                           {watched}/{season.count}
                        </p>
                     </div>
                     <ol className="flex flex-wrap gap-1">
                        {seen.map((episode, index) => {
                           const number = index + 1;
                           const plays = episode?.plays ?? 0;
                           return (
                              <li key={number}>
                                 <span
                                    className={cn(
                                       "flex h-5 w-5 items-center justify-center rounded-[3px] text-[9px] font-medium tabular-nums",
                                       tileClass(plays),
                                    )}
                                 >
                                    <span aria-hidden>{number}</span>
                                    <span className="sr-only">
                                       {`Season ${season.index} episode ${number}: ${
                                          plays === 0
                                             ? "not watched"
                                             : `${plays} play${
                                                  plays === 1 ? "" : "s"
                                               }`
                                       }`}
                                    </span>
                                 </span>
                              </li>
                           );
                        })}
                     </ol>
                  </div>
               );
            })}
         </div>
      </section>
   );
};
