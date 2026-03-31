"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

export const TopGenresChart = () => {
   const trpc = useTRPC();
   const { data, isLoading, isFetching } = useQuery({
      ...trpc.analytics.getTopWatchedGenres.queryOptions(),
      refetchInterval: 15 * 60 * 1000,
   });

   const chartData = data?.data ?? [];

   return (
      <ChartWrapper title="Most Watched Genres" isLoading={isLoading} isFetching={isFetching} lastUpdatedAt={data?.lastUpdatedAt}>
         <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={100}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 12 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-1)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
