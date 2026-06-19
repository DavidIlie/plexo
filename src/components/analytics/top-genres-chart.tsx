"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { getTopWatchedGenresCached } from "~/server/cache/analytics";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface Props {
   data: Awaited<ReturnType<typeof getTopWatchedGenresCached>>;
   lastUpdatedAt?: string;
}

export const TopGenresChart = ({ data, lastUpdatedAt }: Props) => {
   return (
      <ChartWrapper title="Most Watched Genres" isLoading={false} isFetching={false} lastUpdatedAt={lastUpdatedAt}>
         <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={100}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 12 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="plays"
               fill="var(--chart-1)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
