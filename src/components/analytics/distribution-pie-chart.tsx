"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { PieChart, Pie, Cell, Sector, Tooltip, Legend } from "recharts";
import type { PieSectorDataItem } from "recharts";

import { ChartEmptyState, ChartWrapper } from "~/components/analytics/chart-wrapper";
import { HOVER_SERIES_OPACITY, MOUNT_ANIMATION } from "~/components/analytics/chart-motion";
import { ChartTooltipCard, ChartTooltipRow } from "~/components/analytics/chart-tooltip";
import { useIsNarrowViewport } from "~/hooks/use-media-query";

export const CHART_COLORS = [
   "var(--chart-1)",
   "var(--chart-2)",
   "var(--chart-3)",
   "var(--chart-4)",
   "var(--chart-5)",
   "oklch(0.7 0.1 120)",
   "oklch(0.6 0.12 200)",
   "oklch(0.65 0.08 280)",
];

// Sweep-in draws once on mount, then never re-animates: the first slice hover
// flips `interacted`, so subsequent re-renders (dimming, active slice) skip it.
const usePieMountAnimation = () => {
   const prefersReducedMotion = useReducedMotion();
   const [interacted, setInteracted] = useState(false);
   return {
      isAnimationActive: !prefersReducedMotion && !interacted,
      markInteracted: () => setInteracted(true),
   };
};

// Active slice grows by 4px. recharts drives this off the tooltip-active index,
// which tracks the hovered slice — same slice our own activeIndex dims around.
const renderActiveSlice = (props: PieSectorDataItem) => (
   <Sector
      cx={props.cx}
      cy={props.cy}
      innerRadius={props.innerRadius}
      outerRadius={props.outerRadius + 4}
      startAngle={props.startAngle}
      endAngle={props.endAngle}
      cornerRadius={props.cornerRadius}
      fill={props.fill}
   />
);

interface PieTooltipProps {
   active?: boolean;
   payload?: Array<{ name?: string; value?: number }>;
   total: number;
   colorFor: (name: string) => string;
}

const DistributionTooltip = ({ active, payload, total, colorFor }: PieTooltipProps) => {
   if (!active || !payload?.length) return null;
   const slice = payload[0];
   const name = slice.name ?? "";
   const value = slice.value ?? 0;
   const pct = total > 0 ? Math.round((value / total) * 100) : 0;
   return (
      <ChartTooltipCard header={name}>
         <ChartTooltipRow color={colorFor(name)} label="Count" value={value.toLocaleString()} />
         <ChartTooltipRow color={colorFor(name)} label="Share" value={`${pct}%`} muted />
      </ChartTooltipCard>
   );
};

interface DistributionPieChartProps {
   data: Array<{ name: string; count: number }>;
   title: string;
   description?: string;
   lastUpdatedAt?: string;
   hideWhenEmpty?: boolean;
}

export const DistributionPieChart = ({
   data,
   title,
   description,
   lastUpdatedAt,
   hideWhenEmpty = false,
}: DistributionPieChartProps) => {
   const chartData = data.slice(0, 8);
   const { isAnimationActive, markInteracted } = usePieMountAnimation();
   const [activeIndex, setActiveIndex] = useState<number | null>(null);
   const isNarrow = useIsNarrowViewport();

   if (chartData.length === 0) {
      if (hideWhenEmpty) return null;
      return (
         <ChartWrapper
            title={title}
            description={description}
            isLoading={false}
            isFetching={false}
            lastUpdatedAt={lastUpdatedAt}
            empty={<ChartEmptyState />}
         />
      );
   }

   const total = chartData.reduce((sum, d) => sum + d.count, 0);
   const colorFor = (name: string) => {
      const idx = chartData.findIndex((d) => d.name === name);
      return CHART_COLORS[(idx < 0 ? 0 : idx) % CHART_COLORS.length];
   };

   return (
      <ChartWrapper
         title={title}
         description={description}
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <PieChart>
            <Pie
               data={chartData}
               cx="50%"
               cy="50%"
               innerRadius={isNarrow ? 48 : 55}
               outerRadius={isNarrow ? 78 : 90}
               dataKey="count"
               nameKey="name"
               paddingAngle={2}
               cornerRadius={4}
               strokeWidth={0}
               isAnimationActive={isAnimationActive}
               {...MOUNT_ANIMATION}
               activeShape={renderActiveSlice}
               onMouseEnter={(_, index) => {
                  markInteracted();
                  setActiveIndex(index);
               }}
               onMouseLeave={() => setActiveIndex(null)}
            >
               {chartData.map((_, index) => (
                  <Cell
                     key={`cell-${index}`}
                     fill={CHART_COLORS[index % CHART_COLORS.length]}
                     fillOpacity={
                        activeIndex === null || activeIndex === index ? 1 : HOVER_SERIES_OPACITY
                     }
                     style={{ transition: "fill-opacity 200ms ease-out" }}
                  />
               ))}
            </Pie>
            <Tooltip
               content={<DistributionTooltip total={total} colorFor={colorFor} />}
               wrapperStyle={{ outline: "none" }}
            />
            <Legend
               layout={isNarrow ? "horizontal" : "vertical"}
               align={isNarrow ? "center" : "right"}
               verticalAlign={isNarrow ? "bottom" : "middle"}
               iconType="circle"
               iconSize={8}
               wrapperStyle={
                  isNarrow
                     ? { fontSize: "11px" }
                     : { fontSize: "11px", paddingLeft: "12px" }
               }
               formatter={(value: string) => (
                  <span style={{ color: "var(--muted-foreground)" }}>
                     {isNarrow && value.length > 14
                        ? `${value.slice(0, 13)}…`
                        : value}
                  </span>
               )}
            />
         </PieChart>
      </ChartWrapper>
   );
};
