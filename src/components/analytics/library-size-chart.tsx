"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { getLibrarySizeStatsCached } from "~/server/cache/analytics";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const formatBytes = (bytes: number) => {
   if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
   if (bytes < 1024 * 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
   return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
};

const TB = 1024 * 1024 * 1024 * 1024;
const GB = 1024 * 1024 * 1024;

interface Props {
   data: Awaited<ReturnType<typeof getLibrarySizeStatsCached>>;
   lastUpdatedAt?: string;
}

export const LibrarySizeChart = ({ data, lastUpdatedAt }: Props) => {
   const useTB = useMemo(() => data.some((d) => d.bytes >= TB), [data]);

   if (data.length === 0) return null;

   const chartData = data.map((d) => ({
      name: d.name,
      size: useTB
         ? Math.round((d.bytes / TB) * 100) / 100
         : Math.round((d.bytes / GB) * 10) / 10,
      displaySize: formatBytes(d.bytes),
      items: d.items,
   }));

   const unit = useTB ? "TB" : "GB";

   return (
      <ChartWrapper
         title="Library Size"
         description="Storage usage per library"
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" />
            <YAxis
               stroke="var(--muted-foreground)"
               tickFormatter={(v: number) => `${v} ${unit}`}
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
               dataKey="size"
               fill="var(--chart-2)"
               radius={[4, 4, 0, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
