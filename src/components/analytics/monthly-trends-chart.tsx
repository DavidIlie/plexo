"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface Props {
   timeRange?: number;
}

export const MonthlyTrendsChart: React.FC<Props> = ({ timeRange = 365 }) => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery({
      ...trpc.tautulli.getPlaysByDate.queryOptions({ timeRange }),
      refetchInterval: 15 * 60 * 1000,
   });

   const rawData = data?.data;
   const chartData =
      rawData?.categories.map((date, index) => {
         const point: Record<string, string | number> = { date };
         for (const series of rawData.series) {
            point[series.name] = series.data[index] ?? 0;
         }
         return point;
      }) ?? [];

   const seriesNames = rawData?.series.map((s) => s.name) ?? [];
   const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];

   return (
      <ChartWrapper title="Watch Trends" description={`Daily plays over last ${timeRange} days`} isLoading={isLoading}>
         <AreaChart data={chartData}>
            <XAxis
               dataKey="date"
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 10 }}
               tickFormatter={(value: string) => {
                  const d = new Date(value);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
               }}
            />
            <YAxis stroke="var(--muted-foreground)" width={30} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend />
            {seriesNames.map((name, index) => (
               <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
               />
            ))}
         </AreaChart>
      </ChartWrapper>
   );
};
