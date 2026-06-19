import { Suspense } from "react";

import { env } from "~/env";
import { Skeleton } from "~/components/ui/skeleton";
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

interface Props {
   searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ChartFallback = () => <Skeleton className="h-64 w-full rounded-lg" />;

// Static (period-independent) read charts. Each server component awaits its
// cached data function directly and renders the client chart leaf, streamed
// into the static App Shell via its own Suspense boundary.
const GenreDistributionCard = async () => {
   const data = await getGenreDistributionCached();
   return <GenreDistributionChart data={data} />;
};

const TopGenresCard = async () => {
   const data = await getTopWatchedGenresCached();
   return <TopGenresChart data={data} />;
};

const MediaRatioCard = async () => {
   const data = await getMediaTypeRatioCached();
   return <MediaRatioChart data={data} />;
};

const DeviceCard = async () => {
   const data = await getDeviceStatsCached();
   return <DeviceChart data={data} />;
};

const LocationCard = async () => {
   const data = await getLocationStatsCached();
   return <LocationChart data={data} />;
};

const VideoQualityCard = async () => {
   const data = await getVideoQualityStatsCached();
   return <VideoQualityChart data={data} />;
};

const AudioFormatCard = async () => {
   const data = await getAudioFormatStatsCached();
   return <AudioFormatChart data={data} />;
};

const LibrarySizeCard = async () => {
   const data = await getLibrarySizeStatsCached();
   return <LibrarySizeChart data={data} />;
};

const MusicAudioFormatCard = async () => {
   const data = await getMusicAudioFormatStatsCached();
   return <MusicAudioFormatChart data={data} />;
};

const MusicGenreCard = async () => {
   const data = await getMusicGenreDistributionCached();
   return <MusicGenreChart data={data} />;
};

const TopArtistsCard = async () => {
   const data = await getTopArtistsCached();
   return <TopArtistsChart data={data} />;
};

// Period-dependent charts read the ?period searchParam, so they live in their
// own Suspense'd server child that streams in at request time. periodToDays
// only crosses a number into the cached tautulli functions.
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

const AnalyticsPage = ({ searchParams }: Props) => {
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
               {/* PeriodSelector reads useSearchParams (via nuqs useQueryState),
                   so it streams in via Suspense under Cache Components. */}
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
               <MediaRatioCard />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
               <GenreDistributionCard />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
               <TopGenresCard />
            </Suspense>
            {env.SHOW_DEVICES && (
               <Suspense fallback={<ChartFallback />}>
                  <DeviceCard />
               </Suspense>
            )}
            {env.SHOW_LOCATIONS && (
               <Suspense fallback={<ChartFallback />}>
                  <LocationCard />
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
                     <MusicGenreCard />
                  </Suspense>
                  <Suspense fallback={<ChartFallback />}>
                     <TopArtistsCard />
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
                  <VideoQualityCard />
               </Suspense>
               <Suspense fallback={<ChartFallback />}>
                  <AudioFormatCard />
               </Suspense>
               {env.SHOW_MUSIC && (
                  <Suspense fallback={<ChartFallback />}>
                     <MusicAudioFormatCard />
                  </Suspense>
               )}
               <Suspense fallback={<ChartFallback />}>
                  <LibrarySizeCard />
               </Suspense>
            </div>
         </div>
      </div>
   );
};

export default AnalyticsPage;
