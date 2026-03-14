"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const COLORS = ["var(--chart-1)", "var(--chart-2)"];

export const MediaRatioChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery({
      ...trpc.analytics.getMediaTypeRatio.queryOptions(),
      refetchInterval: 15 * 60 * 1000,
   });

   const chartData = data?.data ?? [];
   const total = chartData.reduce((sum, d) => sum + d.value, 0);

   return (
      <ChartWrapper title="Movies vs TV" isLoading={isLoading}>
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
               {chartData.map((_, index) => (
                  <Cell
                     key={`cell-${index}`}
                     fill={COLORS[index % COLORS.length]}
                  />
               ))}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
         </PieChart>
      </ChartWrapper>
   );
};
