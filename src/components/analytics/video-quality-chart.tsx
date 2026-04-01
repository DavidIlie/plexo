"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

export const VideoQualityChart = () => {
   const trpc = useTRPC();
   const { data, isLoading, isFetching } = useQuery({
      ...trpc.analytics.getVideoQualityStats.queryOptions(),
      refetchInterval: 30 * 60 * 1000,
      gcTime: Infinity,
   });

   const chartData = data?.data ?? [];

   if (!isLoading && chartData.length === 0) return null;

   return (
      <ChartWrapper
         title="Video Quality"
         description="Resolution distribution across your movie library"
         isLoading={isLoading}
         isFetching={isFetching}
         lastUpdatedAt={data?.lastUpdatedAt}
      >
         <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={70}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 11 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="count"
               fill="var(--chart-3)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
