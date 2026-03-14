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

export const WatchTimeByDayChart = () => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.analytics.getWatchTimeByDay.queryOptions(),
   );

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>Watch Time by Day</CardTitle>
            </CardHeader>
            <CardContent>
               <Skeleton className="h-[300px] w-full" />
            </CardContent>
         </Card>
      );
   }

   const rawData = data?.data;
   const chartData =
      rawData?.categories.map((day, index) => ({
         day,
         plays: rawData.series.reduce(
            (sum, series) => sum + (series.data[index] ?? 0),
            0,
         ),
      })) ?? [];

   return (
      <Card>
         <CardHeader>
            <CardTitle>Watch Time by Day</CardTitle>
         </CardHeader>
         <CardContent>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={chartData}>
                  <XAxis
                     dataKey="day"
                     stroke="var(--muted-foreground)"
                     tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="var(--muted-foreground)" />
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
                     fill="var(--chart-2)"
                     radius={[4, 4, 0, 0]}
                  />
               </BarChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>
   );
};
