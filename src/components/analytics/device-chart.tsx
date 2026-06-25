"use client";

import type { getDeviceStatsCached } from "~/server/cache/analytics";
import { VerticalBarChart } from "~/components/analytics/vertical-bar-chart";

interface Props {
   data: Awaited<ReturnType<typeof getDeviceStatsCached>>;
   lastUpdatedAt?: string;
}

export const DeviceChart = ({ data, lastUpdatedAt }: Props) => (
   <VerticalBarChart
      data={data}
      dataKey="plays"
      fill="var(--chart-4)"
      title="Devices"
      lastUpdatedAt={lastUpdatedAt}
      slice={8}
   />
);
