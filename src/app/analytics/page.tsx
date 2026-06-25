import { Suspense, type ComponentType } from "react";
import { connection } from "next/server";

import { env } from "~/env";
import { PeriodSelector } from "~/components/analytics/period-selector";
import { RefreshButton } from "~/components/refresh-button";
import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { TopGenresChart } from "~/components/analytics/top-genres-chart";
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";
import { DeviceChart } from "~/components/analytics/device-chart";
import { LocationChart } from "~/components/analytics/location-chart";
import { VideoQualityChart } from "~/components/analytics/video-quality-chart";
import { AudioFormatChart } from "~/components/analytics/audio-format-chart";
import { LibrarySizeChart } from "~/components/analytics/library-size-chart";
import { MusicAudioFormatChart } from "~/components/analytics/music-audio-format-chart";
import { MusicGenreChart } from "~/components/analytics/music-genre-chart";
import { TopArtistsChart } from "~/components/analytics/top-artists-chart";
import { MonthlyTrendsChart } from "~/components/analytics/monthly-trends-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
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
} from "~/server/cache/analytics";
import {
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
} from "~/lib/tautulli";
import { analyticsSearchParamsCache, periodToDays } from "./search-params";

export const instant = false;

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
   const data = await fetch();
   return <Chart data={data} />;
}

const PeriodCharts = async ({ searchParams }: Props) => {
   const { period } = await analyticsSearchParamsCache.parse(searchParams);
   const days = periodToDays(period);

   const [byDate, byDay, byHour] = await Promise.all([
      getPlaysByDate(days),
      getPlaysByDayOfWeek(days),
      getPlaysByHourOfDay(days),
   ]);

   return (
      <>
         <MonthlyTrendsChart data={byDate} timeRange={days} />
         <WatchTimeByDayChart data={byDay} timeRange={days} />
         <WatchTimeByHourChart data={byHour} timeRange={days} />
      </>
   );
};

const PeriodChartsFallback = () => (
   <>
      <ChartFallback />
      <ChartFallback />
      <ChartFallback />
   </>
);

const AnalyticsPage = async ({ searchParams }: Props) => {
   await connection();
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">Analytics</h1>
               <p className="text-sm text-muted-foreground">
                  Watch patterns and library insights
               </p>
            </div>
            <div className="flex items-center gap-2">
               <Suspense
                  fallback={
                     <div className="h-8 w-[180px] rounded-md border border-border/50 bg-card" />
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
               <CachedChart fetch={getGenreDistributionCached} Chart={GenreDistributionChart} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
               <CachedChart fetch={getTopWatchedGenresCached} Chart={TopGenresChart} />
            </Suspense>
            {env.SHOW_DEVICES && (
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getDeviceStatsCached} Chart={DeviceChart} />
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
                     <CachedChart fetch={getMusicGenreDistributionCached} Chart={MusicGenreChart} />
                  </Suspense>
                  <Suspense fallback={<ChartFallback />}>
                     <CachedChart fetch={getTopArtistsCached} Chart={TopArtistsChart} />
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
                  <CachedChart fetch={getVideoQualityStatsCached} Chart={VideoQualityChart} />
               </Suspense>
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getAudioFormatStatsCached} Chart={AudioFormatChart} />
               </Suspense>
               {env.SHOW_MUSIC && (
                  <Suspense fallback={<ChartFallback />}>
                     <CachedChart fetch={getMusicAudioFormatStatsCached} Chart={MusicAudioFormatChart} />
                  </Suspense>
               )}
               <Suspense fallback={<ChartFallback />}>
                  <CachedChart fetch={getLibrarySizeStatsCached} Chart={LibrarySizeChart} />
               </Suspense>
            </div>
         </div>
      </div>
   );
};

export default AnalyticsPage;
