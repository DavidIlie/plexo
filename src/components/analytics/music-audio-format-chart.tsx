"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import type { getMusicAudioFormatStatsCached } from "~/server/cache/analytics";
import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface Props {
   data: Awaited<ReturnType<typeof getMusicAudioFormatStatsCached>>;
   lastUpdatedAt?: string;
}

export const MusicAudioFormatChart = ({ data, lastUpdatedAt }: Props) => {
   if (data.length === 0) return null;

   return (
      <ChartWrapper
         title="Music Audio Format"
         description="Audio codec distribution across your music library"
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={70}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: 11 }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
               dataKey="count"
               fill="var(--chart-1)"
               radius={[0, 4, 4, 0]}
            />
         </BarChart>
      </ChartWrapper>
   );
};
