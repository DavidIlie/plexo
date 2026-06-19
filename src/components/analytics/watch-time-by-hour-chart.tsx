"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { TautulliPlaysByHourOfDay } from "~/types/tautulli";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

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
   const chartData = data.categories.map((hour, index) => ({
      hour: formatHour(hour),
      plays: data.series.reduce(
         (sum, series) => sum + (series.data[index] ?? 0),
         0,
      ),
   }));

   return (
      <ChartWrapper title="Favorite Viewing Times" description={`Plays by hour of day, last ${timeRange} days`} isLoading={false} isFetching={false} lastUpdatedAt={lastUpdatedAt}>
         <BarChart data={chartData}>
            <XAxis
               dataKey="hour"
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 9 }}
               interval={2}
            />
            <YAxis stroke="var(--muted-foreground)" width={30} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-3)"
               radius={[3, 3, 0, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
