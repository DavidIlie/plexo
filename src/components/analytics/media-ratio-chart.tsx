"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

const COLORS = ["var(--chart-1)", "var(--chart-2)"];

export const MediaRatioChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getMediaTypeRatio.queryOptions(),
   );

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Movies vs TV</CardTitle>
            </CardHeader>
            <CardContent>
               <Skeleton className="h-[300px] w-full" />
            </CardContent>
         </Card>
      );
   }

   const chartData = data?.data ?? [];
   const total = chartData.reduce((sum, d) => sum + d.value, 0);

   return (
      <Card>
         <CardHeader>
            <CardTitle>Movies vs TV</CardTitle>
         </CardHeader>
         <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
