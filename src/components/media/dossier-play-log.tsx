import { format } from "date-fns";

import { PlatformBadge } from "~/components/media/platform-icon";
import { ViewerIdentity } from "~/components/viewer-identity";
import { formatPlayDuration } from "~/lib/duration";
import { playTimestamp } from "~/lib/dossier";
import type { ActivityHistoryItem } from "~/types/tautulli";

const playTitle = (play: ActivityHistoryItem) => {
   if (
      play.media_type === "episode" &&
      play.parent_media_index != null &&
      play.media_index != null
   ) {
      return `S${play.parent_media_index}E${play.media_index} · ${play.title}`;
   }
   return play.full_title || play.title;
};

interface Props {
   plays: ActivityHistoryItem[];
   truncated: boolean;
}

export const DossierPlayLog: React.FC<Props> = ({ plays, truncated }) => (
   <section aria-labelledby="play-log-heading" className="space-y-3">
      <div>
         <h2 id="play-log-heading" className="text-sm font-medium">
            Viewing ledger
         </h2>
         <p className="text-xs text-muted-foreground">
            Most recent sessions, newest first
         </p>
      </div>

      {plays.length === 0 ? (
         <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
               No watch sessions have been recorded for this title.
            </p>
         </div>
      ) : (
         <ol className="divide-y divide-border/50 border-y border-border/50">
            {plays.map((play) => {
               const timestamp = playTimestamp(play);
               return (
                  <li
                     key={play.row_id}
                     className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                  >
                     <div className="min-w-0">
                        <p className="truncate text-sm">{playTitle(play)}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                           <time dateTime={new Date(timestamp * 1000).toISOString()}>
                              {format(
                                 new Date(timestamp * 1000),
                                 "d MMM yyyy, HH:mm",
                              )}
                           </time>
                           {play.viewer ? (
                              <>
                                 <span aria-hidden className="text-border">
                                    ·
                                 </span>
                                 <ViewerIdentity viewer={play.viewer} />
                              </>
                           ) : null}
                        </div>
                     </div>
                     <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:justify-end">
                        {play.play_duration > 0 && (
                           <span className="tabular-nums">
                              {formatPlayDuration(play.play_duration)}
                           </span>
                        )}
                        {play.platform && (
                           <PlatformBadge platform={play.platform} />
                        )}
                        {play.watched_status === 1 && (
                           <span className="text-primary">Finished</span>
                        )}
                     </div>
                  </li>
               );
            })}
         </ol>
      )}

      {truncated && (
         <p className="text-[11px] text-muted-foreground">
            Showing the 60 most recent sessions. KPIs and the timeline use the
            complete history.
         </p>
      )}
   </section>
);
