"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

export const WatchTimeByHourChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getWatchTimeByHour.queryOptions(),
   );

   const rawData = data?.data;
   const chartData =
      rawData?.categories.map((hour, index) => ({
         hour,
         plays: rawData.series.reduce(
            (sum, series) => sum + (series.data[index] ?? 0),
            0,
         ),
      })) ?? [];

   return (
      <ChartWrapper title="Favorite Viewing Times" isLoading={isLoading}>
         <BarChart data={chartData}>
            <XAxis
               dataKey="hour"
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 10 }}
            />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-3)"
               radius={[4, 4, 0, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
