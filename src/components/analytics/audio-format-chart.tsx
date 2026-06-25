"use client";

import type { getAudioFormatStatsCached } from "~/server/cache/analytics";
import { VerticalBarChart } from "~/components/analytics/vertical-bar-chart";

interface Props {
   data: Awaited<ReturnType<typeof getAudioFormatStatsCached>>;
   lastUpdatedAt?: string;
}

export const AudioFormatChart = ({ data, lastUpdatedAt }: Props) => (
   <VerticalBarChart
      data={data}
      dataKey="count"
      fill="var(--chart-5)"
      title="Audio Format"
      description="Audio codec distribution across your movie library"
      lastUpdatedAt={lastUpdatedAt}
      yWidth={100}
   />
);
