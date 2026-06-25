"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

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
   if (hideWhenEmpty && chartData.length === 0) return null;

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
                     fill={CHART_COLORS[index % CHART_COLORS.length]}
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
