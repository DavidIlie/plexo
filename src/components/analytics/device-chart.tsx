"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { getDeviceStatsCached } from "~/server/cache/analytics";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface Props {
   data: Awaited<ReturnType<typeof getDeviceStatsCached>>;
   lastUpdatedAt?: string;
}

export const DeviceChart = ({ data, lastUpdatedAt }: Props) => {
   const chartData = data.slice(0, 8);

   if (chartData.length === 0) return null;

   return (
      <ChartWrapper title="Devices" isLoading={false} isFetching={false} lastUpdatedAt={lastUpdatedAt}>
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
