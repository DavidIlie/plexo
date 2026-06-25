"use client";

import type { getVideoQualityStatsCached } from "~/server/cache/analytics";
import { VerticalBarChart } from "~/components/analytics/vertical-bar-chart";

interface Props {
   data: Awaited<ReturnType<typeof getVideoQualityStatsCached>>;
   lastUpdatedAt?: string;
}

export const VideoQualityChart = ({ data, lastUpdatedAt }: Props) => (
   <VerticalBarChart
      data={data}
      dataKey="count"
      fill="var(--chart-3)"
      title="Video Quality"
      description="Resolution distribution across your movie library"
      lastUpdatedAt={lastUpdatedAt}
      yWidth={70}
   />
);
