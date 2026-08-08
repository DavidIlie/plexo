"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";

import type { TautulliPlaysByDayOfWeek } from "~/types/tautulli";
import { ChartWrapper } from "~/components/analytics/chart-wrapper";
import {
   BAR_CURSOR,
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
   lastUpdatedAt?: string;
}

export const WatchTimeByDayChart: React.FC<Props> = ({
   data,
   timeRange = 30,
   lastUpdatedAt,
}) => {
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();

   const chartData = data.categories.map((day, index) => ({
      day,
      plays: data.series.reduce(
         (sum, series) => sum + (series.data[index] ?? 0),
         0,
      ),
   }));

   return (
      <ChartWrapper title="Watch Time by Day" description={`Plays by day of week, last ${timeRange} days`} isLoading={false} isFetching={false} lastUpdatedAt={lastUpdatedAt}>
         <BarChart data={chartData} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            <XAxis
               dataKey="day"
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
               width={30}
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
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
               fill={CHART_COLOR}
               radius={[4, 4, 0, 0]}
               isAnimationActive={baseAnimate}
               {...MOUNT_ANIMATION}
            >
               {chartData.map((_, i) => (
                  <Cell
                     key={i}
                     fillOpacity={hovering && hoverIdx !== i ? HOVER_SERIES_OPACITY : 1}
                  />
               ))}
            </Bar>
         </BarChart>
      </ChartWrapper>
   );
};
