"use client";

import { useId } from "react";
import { BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, Tooltip } from "recharts";

import type { TautulliPlaysByHourOfDay } from "~/types/tautulli";
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

const CHART_COLOR = "var(--chart-3)";

const formatHour = (h: string) => {
   const num = parseInt(h);
   if (num === 0) return "12am";
   if (num === 12) return "12pm";
   return num < 12 ? `${num}am` : `${num - 12}pm`;
};

interface Props {
   data: TautulliPlaysByHourOfDay;
   timeRange?: number;
   isAllTime?: boolean;
   lastUpdatedAt?: string;
}

export const WatchTimeByHourChart: React.FC<Props> = ({
   data,
   timeRange = 30,
   isAllTime = false,
   lastUpdatedAt,
}) => {
   const gradId = useId();
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();

   const chartData = data.categories.map((hour, index) => ({
      hour: formatHour(hour),
      plays: data.series.reduce(
         (sum, series) => sum + (series.data[index] ?? 0),
         0,
      ),
   }));

   const total = chartData.reduce((sum, d) => sum + d.plays, 0);
   const avg = chartData.length > 0 ? total / chartData.length : 0;
   // Peak hour gets the solid accent fill; ignore all-zero ranges.
   const peakIdx = chartData.reduce(
      (best, d, i) =>
         d.plays > 0 && (best < 0 || d.plays > (chartData[best]?.plays ?? 0))
            ? i
            : best,
      -1,
   );

   return (
      <ChartWrapper
         title="Favorite Viewing Times"
         description={
            isAllTime
               ? "Plays by hour of day across all history"
               : `Plays by hour of day, last ${timeRange} days`
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
               dataKey="hour"
               interval="preserveStartEnd"
               minTickGap={18}
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
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
                  const item = payload[0].payload as { hour: string; plays: number };
                  return (
                     <ChartTooltipCard header={item.hour}>
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
               maxBarSize={24}
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
