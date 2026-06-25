"use client";

import type { getTopWatchedGenresCached } from "~/server/cache/analytics";
import { VerticalBarChart } from "~/components/analytics/vertical-bar-chart";

interface Props {
   data: Awaited<ReturnType<typeof getTopWatchedGenresCached>>;
   lastUpdatedAt?: string;
}

export const TopGenresChart = ({ data, lastUpdatedAt }: Props) => (
   <VerticalBarChart
      data={data}
      dataKey="plays"
      fill="var(--chart-1)"
      title="Most Watched Genres"
      lastUpdatedAt={lastUpdatedAt}
      yWidth={100}
      tickFontSize={12}
   />
);
