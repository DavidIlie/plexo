"use client";

import { m } from "framer-motion";
import { UserRound } from "lucide-react";

import type { getViewerActivityCached } from "~/server/cache/analytics";
import { ChartCard } from "~/components/analytics/chart-wrapper";
import { ViewerAvatar } from "~/components/viewer-identity";
import { formatPlayDuration } from "~/lib/duration";
import { cn } from "~/lib/utils";

type ViewerActivity = Awaited<
   ReturnType<typeof getViewerActivityCached>
>["items"];

const BAR_COLORS = [
   "var(--chart-1)",
   "var(--chart-2)",
   "var(--chart-3)",
   "var(--chart-4)",
] as const;

export const ViewerActivityCard = ({
   data,
   selectedViewerId,
}: {
   data: ViewerActivity;
   selectedViewerId?: string;
}) => {
   const totalPlays = data.reduce((sum, item) => sum + item.plays, 0);
   const totalDuration = data.reduce((sum, item) => sum + item.duration, 0);
   const topViewers = data.slice(0, 5);
   const selectedViewerHasActivity = data.some(
      (item) => item.viewer.id === selectedViewerId,
   );

   return (
      <ChartCard
         title="Top Viewers"
         description={
            selectedViewerId
               ? selectedViewerHasActivity
                  ? "Household comparison · selected viewer highlighted"
                  : "Household comparison · no plays for the selected viewer"
               : "Plays and watch time in this period"
         }
      >
         {data.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center sm:min-h-[280px]">
               <p className="text-xs text-muted-foreground">
                  No viewer activity in this period
               </p>
            </div>
         ) : (
            <div className="flex min-h-[220px] flex-col justify-between gap-5 pt-2 sm:min-h-[280px]">
               <ol className="space-y-4">
                  {topViewers.map((item, index) => {
                     const share =
                        totalPlays > 0 ? (item.plays / totalPlays) * 100 : 0;
                     const color = BAR_COLORS[index % BAR_COLORS.length];

                     return (
                        <m.li
                           key={item.viewer.id}
                           aria-current={
                              item.viewer.id === selectedViewerId
                                 ? "true"
                                 : undefined
                           }
                           initial={{ opacity: 0, y: 8 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{
                              duration: 0.3,
                              delay: index * 0.05,
                              ease: [0.23, 1, 0.32, 1],
                           }}
                        >
                           <div
                              className={cn(
                                 "grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-2.5 transition-colors duration-200",
                                 item.viewer.id === selectedViewerId &&
                                    "text-primary",
                              )}
                           >
                              <span
                                 className={cn(
                                    "text-[10px] tabular-nums text-muted-foreground/60",
                                    item.viewer.id === selectedViewerId &&
                                       "text-primary/70",
                                 )}
                              >
                                 {String(index + 1).padStart(2, "0")}
                              </span>
                              <div className="flex min-w-0 items-center gap-2.5">
                                 {item.viewer.showAvatar ? (
                                    <ViewerAvatar viewer={item.viewer} size="md" />
                                 ) : (
                                    <UserRound
                                       className="h-4 w-4 shrink-0 text-muted-foreground"
                                       aria-hidden="true"
                                    />
                                 )}
                                 <span className="truncate text-sm font-medium">
                                    {item.viewer.label}
                                 </span>
                              </div>
                              <div className="flex shrink-0 items-baseline gap-2 text-right">
                                 <span className="text-sm font-medium tabular-nums">
                                    {item.plays.toLocaleString()}
                                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                       {item.plays === 1 ? "play" : "plays"}
                                    </span>
                                 </span>
                                 <span className="w-14 text-[10px] tabular-nums text-muted-foreground">
                                    {formatPlayDuration(item.duration)}
                                 </span>
                              </div>
                              <div
                                 className="col-start-2 col-end-4 mt-2 h-1 overflow-hidden rounded-full bg-muted/60"
                                 aria-label={`${share.toFixed(0)}% of plays`}
                                 aria-valuemax={100}
                                 aria-valuemin={0}
                                 aria-valuenow={Math.round(share)}
                                 role="progressbar"
                              >
                                 <m.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                       duration: 0.6,
                                       delay: 0.12 + index * 0.05,
                                       ease: [0.23, 1, 0.32, 1],
                                    }}
                                    className="h-full origin-left rounded-full"
                                    style={{
                                       width: `${share}%`,
                                       backgroundColor: color,
                                    }}
                                 />
                              </div>
                           </div>
                        </m.li>
                     );
                  })}
               </ol>

               <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
                  <span>{totalPlays.toLocaleString()} total plays</span>
                  <span className="text-border">·</span>
                  <span>{formatPlayDuration(totalDuration)} watched</span>
               </div>
            </div>
         )}
      </ChartCard>
   );
};
