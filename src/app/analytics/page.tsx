import { Suspense } from "react";
import { trpc, getQueryClient, HydrateClient } from "~/trpc/server";
import { Skeleton } from "~/components/ui/skeleton";
import { AnalyticsContent } from "./analytics-content";
import { analyticsSearchParamsCache, periodToDays } from "./search-params";

interface Props {
   searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const AnalyticsFallback = () => (
   <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
         <Skeleton key={i} className="h-64 w-full rounded-lg" />
      ))}
   </div>
);

// Reading searchParams defers this to request time, so it lives in a Suspense'd
// child while the page itself stays a static App Shell.
const AnalyticsData = async ({ searchParams }: Props) => {
   const { period } = await analyticsSearchParamsCache.parse(searchParams);
   const days = periodToDays(period);
   const queryClient = getQueryClient();

   // Prefetch all chart data server-side so the client has data immediately
   void queryClient.prefetchQuery(
      trpc.tautulli.getPlaysByDate.queryOptions({ timeRange: days }),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getMediaTypeRatio.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getGenreDistribution.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getTopWatchedGenres.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.tautulli.getPlaysByDayOfWeek.queryOptions({ timeRange: days }),
   );
   void queryClient.prefetchQuery(
      trpc.tautulli.getPlaysByHourOfDay.queryOptions({ timeRange: days }),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getDeviceStats.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getLocationStats.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getVideoQualityStats.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getAudioFormatStats.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getMusicAudioFormatStats.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getLibrarySizeStats.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getMusicGenreDistribution.queryOptions(),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getTopArtists.queryOptions(),
   );

   return (
      <HydrateClient>
         <AnalyticsContent />
      </HydrateClient>
   );
};

const AnalyticsPage = ({ searchParams }: Props) => {
   return (
      <div className="space-y-6">
         <Suspense fallback={<AnalyticsFallback />}>
            <AnalyticsData searchParams={searchParams} />
         </Suspense>
      </div>
   );
};
export default AnalyticsPage;
