"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

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

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Library by Genre</CardTitle>
            </CardHeader>
            <CardContent>
               <Skeleton className="h-[300px] w-full" />
            </CardContent>
         </Card>
      );
   }

   const chartData = data?.data ?? [];

   return (
      <Card>
         <CardHeader>
            <CardTitle>Library by Genre</CardTitle>
         </CardHeader>
         <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                  <Tooltip
                     contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--foreground)",
                     }}
                  />
               </PieChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>
   );
};
