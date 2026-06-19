"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { TautulliPlaysByDayOfWeek } from "~/types/tautulli";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

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
   const chartData = data.categories.map((day, index) => ({
      day,
      plays: data.series.reduce(
         (sum, series) => sum + (series.data[index] ?? 0),
         0,
      ),
   }));

   return (
      <ChartWrapper title="Watch Time by Day" description={`Plays by day of week, last ${timeRange} days`} isLoading={false} isFetching={false} lastUpdatedAt={lastUpdatedAt}>
         <BarChart data={chartData}>
            <XAxis
               dataKey="day"
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 12 }}
            />
            <YAxis stroke="var(--muted-foreground)" width={30} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-2)"
               radius={[4, 4, 0, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
