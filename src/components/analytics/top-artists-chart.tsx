"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { getTopArtistsCached } from "~/server/cache/analytics";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface Props {
   data: Awaited<ReturnType<typeof getTopArtistsCached>>;
   lastUpdatedAt?: string;
}

export const TopArtistsChart = ({ data, lastUpdatedAt }: Props) => {
   const chartData = data.slice(0, 10);

   if (chartData.length === 0) return null;

   return (
      <ChartWrapper
         title="Most Played Artists"
         description="Artists with the most plays from your history"
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={100}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 11 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-3)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
