"use client";

import type { getTopArtistsCached } from "~/server/cache/analytics";
import { VerticalBarChart } from "~/components/analytics/vertical-bar-chart";

interface Props {
   data: Awaited<ReturnType<typeof getTopArtistsCached>>;
   lastUpdatedAt?: string;
}

export const TopArtistsChart = ({ data, lastUpdatedAt }: Props) => (
   <VerticalBarChart
      data={data}
      dataKey="plays"
      fill="var(--chart-3)"
      title="Most Played Artists"
      description="Artists with the most plays from your history"
      lastUpdatedAt={lastUpdatedAt}
      yWidth={100}
      slice={10}
   />
);
