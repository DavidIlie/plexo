"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

export const TopArtistsChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getTopArtists.queryOptions(),
   );

   if (data?.data === null) return null;

   const chartData = (data?.data ?? []).slice(0, 10);

   if (!isLoading && chartData.length === 0) return null;

   return (
      <ChartWrapper
         title="Most Played Artists"
         description="Artists with the most plays from your history"
         isLoading={isLoading}
      >
         <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={100}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 11 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-3)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
