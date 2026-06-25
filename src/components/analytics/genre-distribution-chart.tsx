"use client";

import type { getGenreDistributionCached } from "~/server/cache/analytics";
import { DistributionPieChart } from "~/components/analytics/distribution-pie-chart";

interface Props {
   data: Awaited<ReturnType<typeof getGenreDistributionCached>>;
   lastUpdatedAt?: string;
}

export const GenreDistributionChart = ({ data, lastUpdatedAt }: Props) => (
   <DistributionPieChart
      data={data}
      title="Library by Genre"
      description="Top genres across all movies and TV shows"
      lastUpdatedAt={lastUpdatedAt}
   />
);
