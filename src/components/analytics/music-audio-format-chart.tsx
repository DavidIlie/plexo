"use client";

import type { getMusicAudioFormatStatsCached } from "~/server/cache/analytics";
import { VerticalBarChart } from "~/components/analytics/vertical-bar-chart";

interface Props {
   data: Awaited<ReturnType<typeof getMusicAudioFormatStatsCached>>;
   lastUpdatedAt?: string;
}

export const MusicAudioFormatChart = ({ data, lastUpdatedAt }: Props) => (
   <VerticalBarChart
      data={data}
      dataKey="count"
      fill="var(--chart-1)"
      title="Music Audio Format"
      description="Audio codec distribution across your music library"
      lastUpdatedAt={lastUpdatedAt}
      yWidth={70}
   />
);
