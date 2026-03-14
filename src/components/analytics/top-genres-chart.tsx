"use client";

import { useQuery } from "@tanstack/react-query";
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   ResponsiveContainer,
   Tooltip,
} from "recharts";

import { useTRPC } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export const TopGenresChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getTopWatchedGenres.queryOptions(),
   );

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Most Watched Genres</CardTitle>
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
            <CardTitle>Most Watched Genres</CardTitle>
         </CardHeader>
         <CardContent>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="var(--muted-foreground)" />
                  <YAxis
                     type="category"
                     dataKey="name"
                     width={100}
                     stroke="var(--muted-foreground)"
                     tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                     contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--foreground)",
                     }}
                  />
                  <Bar
                     dataKey="plays"
                     fill="var(--chart-1)"
                     radius={[0, 4, 4, 0]}
                  />
               </BarChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>
   );
};
