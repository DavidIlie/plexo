"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";

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

interface VerticalBarChartProps {
   data: Array<{ name: string; count?: number; plays?: number }>;
   dataKey: "count" | "plays";
   fill: string;
   title: string;
   description?: string;
   lastUpdatedAt?: string;
   yWidth?: number;
   tickFontSize?: number;
   slice?: number;
}

const VerticalBarTooltip = ({
   active,
   label,
   payload,
   fill,
   metricLabel,
}: Partial<TooltipContentProps<number, string>> & {
   fill: string;
   metricLabel: string;
}) => {
   if (!active || !payload?.length) return null;
   const value = Number(payload[0]?.value ?? 0);

   return (
      <ChartTooltipCard header={String(label ?? "")}>
         <ChartTooltipRow
            color={fill}
            label={metricLabel}
            value={value.toLocaleString()}
         />
      </ChartTooltipCard>
   );
};

export const VerticalBarChart = ({
   data,
   dataKey,
   fill,
   title,
   description,
   lastUpdatedAt,
   yWidth = 90,
   tickFontSize = 11,
   slice,
}: VerticalBarChartProps) => {
   const chartData = slice ? data.slice(0, slice) : data;
   const { hoverIdx, baseAnimate, onMouseMove, onMouseLeave } = useChartHover();
   if (chartData.length === 0) return null;

   return (
      <ChartWrapper
         title={title}
         description={description}
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <BarChart
            data={chartData}
            layout="vertical"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
         >
            <XAxis
               type="number"
               stroke="var(--muted-foreground)"
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: tickFontSize, fill: "var(--muted-foreground)" }}
            />
            <YAxis
               type="category"
               dataKey="name"
               width={yWidth}
               stroke="var(--muted-foreground)"
               tickLine={false}
               axisLine={false}
               tick={{ fontSize: tickFontSize, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
               cursor={BAR_CURSOR}
               content={
                  <VerticalBarTooltip
                     fill={fill}
                     metricLabel={dataKey === "plays" ? "Plays" : "Count"}
                  />
               }
            />
            <Bar
               dataKey={dataKey}
               fill={fill}
               radius={[0, 4, 4, 0]}
               isAnimationActive={baseAnimate}
               {...MOUNT_ANIMATION}
            >
               {chartData.map((entry, index) => (
                  <Cell
                     key={entry.name}
                     fillOpacity={
                        hoverIdx === null || hoverIdx === index
                           ? 1
                           : HOVER_SERIES_OPACITY
                     }
                  />
               ))}
            </Bar>
         </BarChart>
      </ChartWrapper>
   );
};
