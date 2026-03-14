"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const COLOR_MAP: Record<string, string> = {
   Movies: "var(--chart-1)",
   "TV Shows": "var(--chart-2)",
   Music: "var(--chart-3)",
};

export const MediaRatioChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery({
      ...trpc.analytics.getMediaTypeRatio.queryOptions(),
      refetchInterval: 15 * 60 * 1000,
   });

   const allData = data?.data ?? [];
   const hasMusic = allData.some((d) => d.name === "Music");
   const [showMusic, setShowMusic] = useState(true);

   const chartData = useMemo(
      () => (showMusic ? allData : allData.filter((d) => d.name !== "Music")),
      [allData, showMusic],
   );
   const total = chartData.reduce((sum, d) => sum + d.value, 0);

   const title = hasMusic && showMusic ? "Movies vs TV vs Music" : "Movies vs TV";

   return (
      <ChartWrapper
         title={title}
         isLoading={isLoading}
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
         <PieChart>
            <Pie
               data={chartData}
               cx="50%"
               cy="50%"
               innerRadius={60}
               outerRadius={100}
               dataKey="value"
               nameKey="name"
               label={({ name, value }) =>
                  `${name}: ${total > 0 ? Math.round((value / total) * 100) : 0}%`
               }
            >
               {chartData.map((entry, index) => (
                  <Cell
                     key={`cell-${index}`}
                     fill={COLOR_MAP[entry.name] ?? "var(--chart-4)"}
                  />
               ))}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
         </PieChart>
      </ChartWrapper>
   );
};
