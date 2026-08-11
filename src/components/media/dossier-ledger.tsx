import { format } from "date-fns";

import { PlatformBadge } from "~/components/media/platform-icon";
import { formatPlayDuration } from "~/lib/duration";
import type { MediaDossier } from "~/types/dossier";

interface Entry {
   label: string;
   value: string;
   detail?: string;
}

const Metric = ({ label, value, detail }: Entry) => (
   <div className="min-w-24">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
         {label}
      </dt>
      <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
      {detail && (
         <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
      )}
   </div>
);

const watchDate = (epochSeconds: number) =>
   format(new Date(epochSeconds * 1000), "d MMM yyyy");

interface Props {
   dossier: MediaDossier;
   isShow: boolean;
   /** Episodes currently present in the Plex library. */
   episodesOnDisk: number;
}

export const DossierLedger: React.FC<Props> = ({
   dossier,
   isShow,
   episodesOnDisk,
}) => {
   const entries: Entry[] = [
      {
         label: "First watched",
         value: dossier.firstWatchedAt
            ? watchDate(dossier.firstWatchedAt)
            : "Never",
      },
      {
         label: "Last watched",
         value: dossier.lastWatchedAt
            ? watchDate(dossier.lastWatchedAt)
            : "Never",
      },
      {
         label: "Plays",
         value: dossier.totalPlays.toLocaleString(),
         detail:
            !isShow && dossier.totalPlays > 1
               ? `${dossier.totalPlays - 1} rewatch${
                    dossier.totalPlays - 1 === 1 ? "" : "es"
                 }`
               : undefined,
      },
      {
         label: "Watch time",
         value:
            dossier.totalSeconds > 0
               ? formatPlayDuration(dossier.totalSeconds)
               : "—",
      },
   ];

   if (isShow) {
      entries.push({
         label: "Episodes seen",
         value:
            episodesOnDisk > 0
               ? `${dossier.distinctEpisodes} / ${episodesOnDisk}`
               : String(dossier.distinctEpisodes),
         detail:
            dossier.totalPlays > dossier.distinctEpisodes
               ? `${dossier.totalPlays - dossier.distinctEpisodes} repeat play${
                    dossier.totalPlays - dossier.distinctEpisodes === 1
                       ? ""
                       : "s"
                 }`
               : undefined,
      });
   }

   if (dossier.totalPlays > 0) {
      entries.push({
         label: "Finished",
         value: `${Math.round(
            (dossier.completedPlays / dossier.totalPlays) * 100,
         )}%`,
         detail: `${dossier.completedPlays} of ${dossier.totalPlays} play${
            dossier.totalPlays === 1 ? "" : "s"
         }`,
      });
   }

   if (dossier.distinctViewers > 1) {
      entries.push({
         label: "Viewers",
         value: String(dossier.distinctViewers),
      });
   }

   return (
      <div className="space-y-3">
         <dl className="flex flex-wrap gap-x-8 gap-y-4 rounded-lg border border-border/50 bg-card/50 px-5 py-4">
            {entries.map((entry) => (
               <Metric key={entry.label} {...entry} />
            ))}
         </dl>
         {dossier.platforms.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[11px] text-muted-foreground">
               <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  Played on
               </span>
               {dossier.platforms.map((platform) => (
                  <span
                     key={platform.name}
                     className="flex items-center gap-1"
                  >
                     <PlatformBadge platform={platform.name} />
                     <span className="tabular-nums text-muted-foreground/70">
                        ×{platform.plays}
                     </span>
                  </span>
               ))}
            </div>
         )}
      </div>
   );
};
