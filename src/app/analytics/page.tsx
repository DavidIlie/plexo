import { trpc, getQueryClient, HydrateClient } from "~/trpc/server";
import { AnalyticsContent } from "./analytics-content";
import { analyticsSearchParamsCache, periodToDays } from "./search-params";

interface Props {
   searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const AnalyticsPage = async ({ searchParams }: Props) => {
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
         <div className="space-y-6">
            <AnalyticsContent />
         </div>
      </HydrateClient>
   );
};
export default AnalyticsPage;
