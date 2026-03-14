"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

export const WatchTimeByDayChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getWatchTimeByDay.queryOptions(),
   );

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
      <ChartWrapper title="Watch Time by Day" description="Plays by day of week over the last 30 days" isLoading={isLoading}>
         <BarChart data={chartData}>
            <XAxis
               dataKey="day"
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 12 }}
            />
            <YAxis stroke="var(--muted-foreground)" />
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
