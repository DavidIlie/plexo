"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface Props {
   timeRange?: number;
}

export const WatchTimeByDayChart: React.FC<Props> = ({ timeRange = 30 }) => {
   const trpc = useTRPC();
   const { data, isLoading, isFetching } = useQuery({
      ...trpc.tautulli.getPlaysByDayOfWeek.queryOptions({ timeRange }),
      refetchInterval: 15 * 60 * 1000,
      gcTime: Infinity,
   });

   const rawData = data?.data;
   const chartData =
      rawData?.categories.map((day, index) => ({
         day,
         plays: rawData.series.reduce(
            (sum, series) => sum + (series.data[index] ?? 0),
            0,
         ),
      })) ?? [];

   return (
      <ChartWrapper title="Watch Time by Day" description={`Plays by day of week, last ${timeRange} days`} isLoading={isLoading} isFetching={isFetching} lastUpdatedAt={data?.lastUpdatedAt}>
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
