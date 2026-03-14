"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { useTRPC } from "~/trpc/react";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

const formatHour = (h: string) => {
   const num = parseInt(h);
   if (num === 0) return "12am";
   if (num === 12) return "12pm";
   return num < 12 ? `${num}am` : `${num - 12}pm`;
};

interface Props {
   timeRange?: number;
}

export const WatchTimeByHourChart: React.FC<Props> = ({ timeRange = 30 }) => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.tautulli.getPlaysByHourOfDay.queryOptions({ timeRange }),
   );

   const rawData = data?.data;
   const chartData =
      rawData?.categories.map((hour, index) => ({
         hour: formatHour(hour),
         plays: rawData.series.reduce(
            (sum, series) => sum + (series.data[index] ?? 0),
            0,
         ),
      })) ?? [];

   return (
      <ChartWrapper title="Favorite Viewing Times" description={`Plays by hour of day, last ${timeRange} days`} isLoading={isLoading}>
         <BarChart data={chartData}>
            <XAxis
               dataKey="hour"
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 9 }}
               interval={2}
            />
            <YAxis stroke="var(--muted-foreground)" width={30} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-3)"
               radius={[3, 3, 0, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
