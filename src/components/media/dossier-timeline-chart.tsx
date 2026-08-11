"use client";

import { useId, useMemo } from "react";
import {
   Bar,
   Cell,
   ComposedChart,
   Line,
   Tooltip,
   XAxis,
   YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import {
   ChartEmptyState,
   ChartWrapper,
} from "~/components/analytics/chart-wrapper";
import {
   ACTIVE_DOT,
   BAR_CURSOR,
   CustomBar,
   HOVER_SERIES_OPACITY,
   MOUNT_ANIMATION,
   useChartHover,
} from "~/components/analytics/chart-motion";
import {
   ChartTooltipCard,
   ChartTooltipRow,
} from "~/components/analytics/chart-tooltip";
import { formatPlayDuration } from "~/lib/duration";
import type { DossierBucket, DossierBucketUnit } from "~/types/dossier";

const PLAYS_COLOR = "var(--chart-1)";
const EPISODES_COLOR = "var(--chart-2)";

interface Props {
   buckets: DossierBucket[];
   bucketUnit: DossierBucketUnit;
   /** Draw the cumulative episodes-seen line for TV shows. */
   showEpisodeProgress: boolean;
   totalPlays: number;
}

const tickFormat = (unit: DossierBucketUnit) =>
   unit === "day" ? "d MMM" : "MMM yy";

const headerFormat = (unit: DossierBucketUnit) =>
   unit === "day" ? "EEE, d MMM yyyy" : "MMMM yyyy";

export const DossierTimelineChart: React.FC<Props> = ({
   buckets,
   bucketUnit,
   showEpisodeProgress,
   totalPlays,
}) => {
   const gradientId = useId();
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();
   const byKey = useMemo(
      () => new Map(buckets.map((bucket) => [bucket.key, bucket])),
      [buckets],
   );

   const description =
      totalPlays === 0
         ? "No plays recorded yet"
         : totalPlays === 1
           ? "A single recorded play"
           : bucketUnit === "day"
             ? "Plays per day since the first watch"
             : "Plays per month since the first watch";

   return (
      <ChartWrapper
         title="Watch timeline"
         description={description}
         isLoading={false}
         isFetching={false}
         empty={
            buckets.length === 0 ? (
               <ChartEmptyState message="No watch history recorded" />
            ) : undefined
         }
      >
         <ComposedChart
            data={buckets}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
         >
            <defs>
               <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
               >
                  <stop
                     offset="0%"
                     stopColor={PLAYS_COLOR}
                     stopOpacity={0.9}
                  />
                  <stop
                     offset="100%"
                     stopColor={PLAYS_COLOR}
                     stopOpacity={0.35}
                  />
               </linearGradient>
            </defs>
            <XAxis
               dataKey="key"
               tickLine={false}
               axisLine={false}
               minTickGap={24}
               tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
               tickFormatter={(value: string) =>
                  format(parseISO(value), tickFormat(bucketUnit))
               }
            />
            <YAxis
               yAxisId="plays"
               width={28}
               allowDecimals={false}
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            {showEpisodeProgress && (
               <YAxis
                  yAxisId="episodes"
                  orientation="right"
                  width={28}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
               />
            )}
            <Tooltip
               cursor={BAR_CURSOR}
               content={({ active, label }) => {
                  if (!active || label == null) return null;
                  const bucket = byKey.get(String(label));
                  if (!bucket) return null;
                  return (
                     <ChartTooltipCard
                        header={format(
                           parseISO(bucket.key),
                           headerFormat(bucketUnit),
                        )}
                     >
                        <ChartTooltipRow
                           color={PLAYS_COLOR}
                           label="Plays"
                           value={bucket.plays.toLocaleString()}
                        />
                        {bucket.seconds > 0 && (
                           <ChartTooltipRow
                              muted
                              label="Watch time"
                              value={formatPlayDuration(bucket.seconds)}
                           />
                        )}
                        {showEpisodeProgress && (
                           <ChartTooltipRow
                              color={EPISODES_COLOR}
                              label="Episodes seen"
                              value={bucket.cumulativeEpisodes.toLocaleString()}
                           />
                        )}
                     </ChartTooltipCard>
                  );
               }}
            />
            <Bar
               yAxisId="plays"
               dataKey="plays"
               name="Plays"
               fill={`url(#${gradientId})`}
               maxBarSize={40}
               shape={<CustomBar barCount={buckets.length} />}
               isAnimationActive={baseAnimate}
               {...MOUNT_ANIMATION}
            >
               {buckets.map((bucket, index) => (
                  <Cell
                     key={bucket.key}
                     fill={`url(#${gradientId})`}
                     fillOpacity={
                        hovering && hoverIdx !== index
                           ? HOVER_SERIES_OPACITY
                           : 1
                     }
                  />
               ))}
            </Bar>
            {showEpisodeProgress && (
               <Line
                  yAxisId="episodes"
                  type="monotone"
                  dataKey="cumulativeEpisodes"
                  name="Episodes seen"
                  stroke={EPISODES_COLOR}
                  strokeOpacity={hovering ? HOVER_SERIES_OPACITY : 1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ ...ACTIVE_DOT, fill: EPISODES_COLOR }}
                  isAnimationActive={baseAnimate}
                  {...MOUNT_ANIMATION}
               />
            )}
         </ComposedChart>
      </ChartWrapper>
   );
};
