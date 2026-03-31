"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const COLORS = [
   "var(--chart-1)",
   "var(--chart-2)",
   "var(--chart-3)",
   "var(--chart-4)",
   "var(--chart-5)",
   "oklch(0.7 0.1 120)",
   "oklch(0.6 0.12 200)",
   "oklch(0.65 0.08 280)",
];

export const GenreDistributionChart = () => {
   const trpc = useTRPC();
   const { data, isLoading, isFetching } = useQuery({
      ...trpc.analytics.getGenreDistribution.queryOptions(),
      refetchInterval: 30 * 60 * 1000,
   });

   const chartData = (data?.data ?? []).slice(0, 8);

   return (
      <ChartWrapper title="Library by Genre" description="Top genres across all movies and TV shows" isLoading={isLoading} isFetching={isFetching} lastUpdatedAt={data?.lastUpdatedAt}>
         <PieChart>
            <Pie
               data={chartData}
               cx="50%"
               cy="50%"
               innerRadius={55}
               outerRadius={90}
               dataKey="count"
               nameKey="name"
               paddingAngle={2}
               strokeWidth={0}
            >
               {chartData.map((_, index) => (
                  <Cell
                     key={`cell-${index}`}
                     fill={COLORS[index % COLORS.length]}
                  />
               ))}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend
               layout="vertical"
               align="right"
               verticalAlign="middle"
               iconType="circle"
               iconSize={8}
               wrapperStyle={{ fontSize: "11px", paddingLeft: "12px" }}
            />
         </PieChart>
      </ChartWrapper>
   );
};
