"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

export const DeviceChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery({
      ...trpc.analytics.getDeviceStats.queryOptions(),
      refetchInterval: 15 * 60 * 1000,
   });

   if (data?.data === null) return null;

   const chartData = (data?.data ?? []).slice(0, 8);

   return (
      <ChartWrapper title="Devices" isLoading={isLoading}>
         <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={90}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 11 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-4)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
