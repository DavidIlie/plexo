import { Suspense, type ComponentType } from "react";
import { connection } from "next/server";
import { format } from "date-fns";

import { env } from "~/env";
import { PeriodSelector } from "~/components/analytics/period-selector";
import { RefreshButton } from "~/components/refresh-button";
import { ViewerStack } from "~/components/viewer-identity";
// First visible row stays statically imported (SSR'd markup, no pop-in);
// everything below the fold goes through the lazy variants so its hydration
// JS is deferred until scrolled near.
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";
import { LocationChart } from "~/components/analytics/location-chart";
import { MonthlyTrendsChart } from "~/components/analytics/monthly-trends-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
import { ViewerActivityCard } from "~/components/analytics/viewer-activity-card";
import {
   AudioFormatChartLazy,
   DeviceChartLazy,
   GenreDistributionChartLazy,
   LibrarySizeChartLazy,
   MusicAudioFormatChartLazy,
   MusicGenreChartLazy,
   TopArtistsChartLazy,
   TopGenresChartLazy,
   VideoQualityChartLazy,
} from "~/components/analytics/lazy-charts";
import { ChartFallback } from "~/components/skeletons";
import {
   getGenreDistributionCached,
   getTopWatchedGenresCached,
   getMediaTypeRatioCached,
   getDeviceStatsCached,
   getLocationStatsCached,
   getVideoQualityStatsCached,
   getAudioFormatStatsCached,
   getLibrarySizeStatsCached,
   getMusicAudioFormatStatsCached,
   getMusicGenreDistributionCached,
   getTopArtistsCached,
   getViewerActivityCached,
} from "~/server/cache/analytics";
import {
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
} from "~/lib/tautulli";
import { getActivityViewers } from "~/server/cache/history";
import {
   analyticsSearchParamsCache,
   periodToDateRange,
} from "./search-params";

interface Props {
   searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function CachedChart<T>({
   fetch,
   Chart,
}: {
   fetch: () => Promise<T>;
   Chart: ComponentType<{ data: T }>;
}) {
   await connection();
   const data = await fetch();
   return <Chart data={data} />;
}

const PeriodCharts = async ({ searchParams }: Props) => {
   await connection();
   const { period } = await analyticsSearchParamsCache.parse(searchParams);
   const { start, end, days } = periodToDateRange(period);
   const viewerAnalyticsEnabled =
      env.VIEWER_DISPLAY !== "hidden" && !env.TAUTULLI_USER_ID;

   const [byDate, byDay, byHour, viewerActivity] = await Promise.all([
      getPlaysByDate(days),
      getPlaysByDayOfWeek(days),
      getPlaysByHourOfDay(days),
      viewerAnalyticsEnabled
         ? getViewerActivityCached(
              format(start, "yyyy-MM-dd"),
              format(end, "yyyy-MM-dd"),
           )
         : Promise.resolve({ viewerCount: 0, items: [] }),
   ]);

   return (
      <>
         <MonthlyTrendsChart data={byDate} timeRange={days} />
         <WatchTimeByDayChart data={byDay} timeRange={days} />
         <WatchTimeByHourChart data={byHour} timeRange={days} />
         {viewerActivity.viewerCount > 1 ? (
            <ViewerActivityCard data={viewerActivity.items} />
         ) : null}
      </>
   );
};

const PeriodChartsFallback = () => (
   <>
      <ChartFallback />
      <ChartFallback />
      <ChartFallback />
      {env.VIEWER_DISPLAY !== "hidden" && !env.TAUTULLI_USER_ID ? (
         <ChartFallback />
      ) : null}
   </>
);

const AnalyticsHeading = async () => {
   await connection();
   const viewers = await getActivityViewers();

   return (
      <div>
         <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold">Analytics</h1>
            <ViewerStack viewers={viewers} />
         </div>
         <p className="text-sm text-muted-foreground">
            {viewers.length > 1
               ? `Watch patterns across ${viewers.length} viewers and library insights`
               : "Watch patterns and library insights"}
         </p>
      </div>
   );
};

const AnalyticsHeadingFallback = () => (
   <div>
      <h1 className="text-lg font-semibold">Analytics</h1>
      <p className="text-sm text-muted-foreground">
         Watch patterns and library insights
      </p>
   </div>
);

const AnalyticsPage = ({ searchParams }: Props) => {
   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-y-2">
            <Suspense fallback={<AnalyticsHeadingFallback />}>
               <AnalyticsHeading />
            </Suspense>
            <div className="flex items-center gap-2">
               <Suspense
                  fallback={
                     <div className="h-8 w-[196px] rounded-md border border-border/50 bg-card" />
                  }
               >
                  <PeriodSelector />
               </Suspense>
               <RefreshButton />
            </div>
         </div>

         <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<ChartFallback />}>
               <PeriodCharts searchParams={searchParams} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
               <CachedChart fetch={getMediaTypeRatioCached} Chart={MediaRatioChart} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
               <CachedChart fetch={getGenreDistributionCached} Chart={GenreDistributionChartLazy} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
               <CachedChart fetch={getTopWatchedGenresCached} Chart={TopGenresChartLazy} />
            </Suspense>
            {env.SHOW_DEVICES && (
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getDeviceStatsCached} Chart={DeviceChartLazy} />
               </Suspense>
            )}
            {env.SHOW_LOCATIONS && (
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getLocationStatsCached} Chart={LocationChart} />
               </Suspense>
            )}
         </div>

         {env.SHOW_MUSIC && (
            <div>
               <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Music
               </h2>
               <div className="grid gap-4 md:grid-cols-2">
                  <Suspense fallback={<ChartFallback />}>
                     <CachedChart fetch={getMusicGenreDistributionCached} Chart={MusicGenreChartLazy} />
                  </Suspense>
                  <Suspense fallback={<ChartFallback />}>
                     <CachedChart fetch={getTopArtistsCached} Chart={TopArtistsChartLazy} />
                  </Suspense>
               </div>
            </div>
         )}

         <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
               Quality &amp; Storage
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getVideoQualityStatsCached} Chart={VideoQualityChartLazy} />
               </Suspense>
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getAudioFormatStatsCached} Chart={AudioFormatChartLazy} />
               </Suspense>
               {env.SHOW_MUSIC && (
                  <Suspense fallback={<ChartFallback />}>
                     <CachedChart fetch={getMusicAudioFormatStatsCached} Chart={MusicAudioFormatChartLazy} />
                  </Suspense>
               )}
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getLibrarySizeStatsCached} Chart={LibrarySizeChartLazy} />
               </Suspense>
            </div>
         </div>
      </div>
   );
};

export default AnalyticsPage;
