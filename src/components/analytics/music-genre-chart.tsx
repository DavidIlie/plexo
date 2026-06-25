"use client";

import type { getMusicGenreDistributionCached } from "~/server/cache/analytics";
import { DistributionPieChart } from "~/components/analytics/distribution-pie-chart";

interface Props {
   data: Awaited<ReturnType<typeof getMusicGenreDistributionCached>>;
   lastUpdatedAt?: string;
}

export const MusicGenreChart = ({ data, lastUpdatedAt }: Props) => (
   <DistributionPieChart
      data={data}
      title="Music by Genre"
      description="Top genres across your music library"
      lastUpdatedAt={lastUpdatedAt}
      hideWhenEmpty
   />
);
