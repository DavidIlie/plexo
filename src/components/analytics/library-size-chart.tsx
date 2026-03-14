"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const formatBytes = (bytes: number) => {
   if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
   if (bytes < 1024 * 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
   return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
};

export const LibrarySizeChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getLibrarySizeStats.queryOptions(),
   );

   const rawData = data?.data ?? [];

   if (!isLoading && rawData.length === 0) return null;

   const chartData = rawData.map((d) => ({
      name: d.name,
      sizeGB: Math.round((d.bytes / (1024 * 1024 * 1024)) * 10) / 10,
      displaySize: formatBytes(d.bytes),
      items: d.items,
   }));

   return (
      <ChartWrapper
         title="Library Size"
         description="Storage usage per library"
         isLoading={isLoading}
      >
         <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" />
            <YAxis
               stroke="var(--muted-foreground)"
               tickFormatter={(v: number) => `${v} GB`}
            />
            <Tooltip
               contentStyle={CHART_TOOLTIP_STYLE}
               content={(props) => {
                  if (!props.active || !props.payload?.[0]) return null;
                  const item = props.payload[0].payload as { name: string; displaySize: string; items: number };
                  return (
                     <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2">
                        <p className="text-xs font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                           {item.displaySize} &middot; {item.items.toLocaleString()} items
                        </p>
                     </div>
                  );
               }}
            />
            <Bar
               dataKey="sizeGB"
               fill="var(--chart-2)"
               radius={[4, 4, 0, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
