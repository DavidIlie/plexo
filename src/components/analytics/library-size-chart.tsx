"use client";

import { useMemo } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";

import type { getLibrarySizeStatsCached } from "~/server/cache/analytics";
import { ChartWrapper } from "~/components/analytics/chart-wrapper";
import {
   BAR_CURSOR,
   HOVER_SERIES_OPACITY,
   MOUNT_ANIMATION,
   useChartHover,
} from "~/components/analytics/chart-motion";
import {
   ChartTooltipCard,
   ChartTooltipRow,
} from "~/components/analytics/chart-tooltip";

const CHART_COLOR = "var(--chart-2)";

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
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();

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
         <BarChart data={chartData} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            <XAxis
               dataKey="name"
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
               tickFormatter={(v: number) => `${v} ${unit}`}
            />
            <Tooltip
               cursor={BAR_CURSOR}
               content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as {
                     name: string;
                     displaySize: string;
                     items: number;
                  };
                  return (
                     <ChartTooltipCard header={item.name}>
                        <ChartTooltipRow
                           color={CHART_COLOR}
                           label="Size"
                           value={item.displaySize}
                        />
                        <ChartTooltipRow
                           label="Items"
                           value={item.items.toLocaleString()}
                           muted
                        />
                     </ChartTooltipCard>
                  );
               }}
            />
            <Bar
               dataKey="size"
               fill={CHART_COLOR}
               radius={[4, 4, 0, 0]}
               isAnimationActive={baseAnimate}
               {...MOUNT_ANIMATION}
            >
               {chartData.map((_, i) => (
                  <Cell
                     key={i}
                     fillOpacity={hovering && hoverIdx !== i ? HOVER_SERIES_OPACITY : 1}
                  />
               ))}
            </Bar>
         </BarChart>
      </ChartWrapper>
   );
};
