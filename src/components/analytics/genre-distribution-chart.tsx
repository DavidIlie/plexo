"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const COLORS = [
   "var(--chart-1)",
   "var(--chart-2)",
   "var(--chart-3)",
   "var(--chart-4)",
   "var(--chart-5)",
   "oklch(0.7 0.12 120)",
   "oklch(0.65 0.15 200)",
   "oklch(0.6 0.18 280)",
];

export const GenreDistributionChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getGenreDistribution.queryOptions(),
   );

   const chartData = data?.data ?? [];

   return (
      <ChartWrapper title="Library by Genre" isLoading={isLoading}>
         <PieChart>
            <Pie
               data={chartData}
               cx="50%"
               cy="50%"
               outerRadius={100}
               dataKey="count"
               nameKey="name"
               label={({ name, percent }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
               }
               labelLine={false}
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
