"use client";

import { useId } from "react";
import { BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, Tooltip } from "recharts";

import type { TautulliPlaysByDayOfWeek } from "~/types/tautulli";
import { ChartWrapper } from "~/components/analytics/chart-wrapper";
import {
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

const CHART_COLOR = "var(--chart-2)";

interface Props {
   data: TautulliPlaysByDayOfWeek;
   timeRange?: number;
   isAllTime?: boolean;
   lastUpdatedAt?: string;
}

export const WatchTimeByDayChart: React.FC<Props> = ({
   data,
   timeRange = 30,
   isAllTime = false,
   lastUpdatedAt,
}) => {
   const gradId = useId();
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();

   const chartData = data.categories.map((day, index) => ({
      day,
      plays: data.series.reduce(
         (sum, series) => sum + (series.data[index] ?? 0),
         0,
      ),
   }));

   const total = chartData.reduce((sum, d) => sum + d.plays, 0);
   const avg = chartData.length > 0 ? total / chartData.length : 0;
   // Peak day gets the solid accent fill; ignore all-zero weeks.
   const peakIdx = chartData.reduce(
      (best, d, i) =>
         d.plays > 0 && (best < 0 || d.plays > (chartData[best]?.plays ?? 0))
            ? i
            : best,
      -1,
   );

   return (
      <ChartWrapper
         title="Watch Time by Day"
         description={
            isAllTime
               ? "Plays by day of week across all history"
               : `Plays by day of week, last ${timeRange} days`
         }
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <BarChart data={chartData} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            <defs>
               <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0.35} />
               </linearGradient>
            </defs>
            <XAxis
               dataKey="day"
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
               width={30}
               allowDecimals={false}
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            {avg > 0 && (
               <ReferenceLine
                  y={avg}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 3"
                  strokeOpacity={0.35}
                  ifOverflow="extendDomain"
               />
            )}
            <Tooltip
               cursor={BAR_CURSOR}
               content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as { day: string; plays: number };
                  return (
                     <ChartTooltipCard header={item.day}>
                        <ChartTooltipRow
                           color={CHART_COLOR}
                           label="Plays"
                           value={item.plays.toLocaleString()}
                        />
                     </ChartTooltipCard>
                  );
               }}
            />
            <Bar
               dataKey="plays"
               fill={`url(#${gradId})`}
               maxBarSize={40}
               shape={<CustomBar barCount={chartData.length} />}
               isAnimationActive={baseAnimate}
               {...MOUNT_ANIMATION}
            >
               {chartData.map((_, i) => (
                  <Cell
                     key={i}
                     fill={i === peakIdx ? CHART_COLOR : `url(#${gradId})`}
                     fillOpacity={hovering && hoverIdx !== i ? HOVER_SERIES_OPACITY : 1}
                  />
               ))}
            </Bar>
         </BarChart>
      </ChartWrapper>
   );
};
