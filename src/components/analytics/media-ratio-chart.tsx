"use client";

import { useState, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { PieChart, Pie, Cell, Sector, Tooltip } from "recharts";
import type { PieSectorDataItem } from "recharts";

import type { getMediaTypeRatioCached } from "~/server/cache/analytics";
import { ChartWrapper } from "~/components/analytics/chart-wrapper";
import { HOVER_SERIES_OPACITY, MOUNT_ANIMATION } from "~/components/analytics/chart-motion";
import { ChartTooltipCard, ChartTooltipRow } from "~/components/analytics/chart-tooltip";
import { AnimatedNumber } from "~/components/ui/animated-number";

const COLOR_MAP: Record<string, string> = {
   Movies: "var(--chart-1)",
   "TV Shows": "var(--chart-2)",
   Music: "var(--chart-3)",
};

const colorFor = (name: string) => COLOR_MAP[name] ?? "var(--chart-4)";

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

interface RatioTooltipProps {
   active?: boolean;
   payload?: Array<{ name?: string; value?: number }>;
   total: number;
}

const RatioTooltip = ({ active, payload, total }: RatioTooltipProps) => {
   if (!active || !payload?.length) return null;
   const slice = payload[0];
   const name = slice.name ?? "";
   const value = slice.value ?? 0;
   const pct = total > 0 ? Math.round((value / total) * 100) : 0;
   return (
      <ChartTooltipCard header={name}>
         <ChartTooltipRow color={colorFor(name)} label="Titles" value={value.toLocaleString()} />
         <ChartTooltipRow color={colorFor(name)} label="Share" value={`${pct}%`} muted />
      </ChartTooltipCard>
   );
};

interface Props {
   data: Awaited<ReturnType<typeof getMediaTypeRatioCached>>;
   lastUpdatedAt?: string;
}

export const MediaRatioChart = ({ data, lastUpdatedAt }: Props) => {
   const allData = data;
   const hasMusic = allData.some((d) => d.name === "Music");
   const [showMusic, setShowMusic] = useState(true);
   const { isAnimationActive, markInteracted } = usePieMountAnimation();
   const [activeIndex, setActiveIndex] = useState<number | null>(null);

   const chartData = useMemo(
      () => (showMusic ? allData : allData.filter((d) => d.name !== "Music")),
      [allData, showMusic],
   );
   const total = chartData.reduce((sum, d) => sum + d.value, 0);

   const title = hasMusic && showMusic ? "Movies vs TV vs Music" : "Movies vs TV";

   return (
      <ChartWrapper
         title={title}
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
         headerRight={
            hasMusic ? (
               <button
                  type="button"
                  onClick={() => setShowMusic((v) => !v)}
                  className="rounded-md border border-border/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
               >
                  {showMusic ? "Hide Music" : "Show Music"}
               </button>
            ) : undefined
         }
      >
         <div className="relative">
            <PieChart>
               <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
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
                  {chartData.map((entry, index) => (
                     <Cell
                        key={`cell-${index}`}
                        fill={colorFor(entry.name)}
                        fillOpacity={
                           activeIndex === null || activeIndex === index ? 1 : HOVER_SERIES_OPACITY
                        }
                        className="transition-[fill-opacity] duration-200 ease-out"
                        style={{ transition: "fill-opacity 200ms ease-out" }}
                     />
                  ))}
               </Pie>
               <Tooltip
                  content={<RatioTooltip total={total} />}
                  wrapperStyle={{ outline: "none" }}
               />
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
               <AnimatedNumber
                  value={total}
                  immediate
                  className="text-2xl font-bold tabular-nums text-foreground"
               />
               <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Titles
               </span>
            </div>
         </div>
      </ChartWrapper>
   );
};
