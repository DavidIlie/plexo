"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";

import type { TautulliPlaysByHourOfDay } from "~/types/tautulli";
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
   lastUpdatedAt?: string;
}

export const WatchTimeByHourChart: React.FC<Props> = ({
   data,
   timeRange = 30,
   lastUpdatedAt,
}) => {
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();

   const chartData = data.categories.map((hour, index) => ({
      hour: formatHour(hour),
      plays: data.series.reduce(
         (sum, series) => sum + (series.data[index] ?? 0),
         0,
      ),
   }));

   return (
      <ChartWrapper title="Favorite Viewing Times" description={`Plays by hour of day, last ${timeRange} days`} isLoading={false} isFetching={false} lastUpdatedAt={lastUpdatedAt}>
         <BarChart data={chartData} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            <XAxis
               dataKey="hour"
               interval={2}
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
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
