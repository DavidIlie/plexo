"use client";

import { Suspense } from "react";

import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { TopGenresChart } from "~/components/analytics/top-genres-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
import { MonthlyTrendsChart } from "~/components/analytics/monthly-trends-chart";
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";
import { DeviceChart } from "~/components/analytics/device-chart";
import { LocationChart } from "~/components/analytics/location-chart";
import { VideoQualityChart } from "~/components/analytics/video-quality-chart";
import { AudioFormatChart } from "~/components/analytics/audio-format-chart";
import { LibrarySizeChart } from "~/components/analytics/library-size-chart";
import { MusicAudioFormatChart } from "~/components/analytics/music-audio-format-chart";
import { PeriodSelector, usePeriodDays } from "~/components/analytics/period-selector";
import { RefreshButton } from "~/components/refresh-button";
import { Skeleton } from "~/components/ui/skeleton";

const AnalyticsCharts = () => {
   const days = usePeriodDays();

   return (
      <div className="space-y-6">
         <div className="grid gap-4 md:grid-cols-2">
            <MonthlyTrendsChart timeRange={days} />
            <MediaRatioChart />
            <GenreDistributionChart />
            <TopGenresChart />
            <WatchTimeByDayChart timeRange={days} />
            <WatchTimeByHourChart timeRange={days} />
            <DeviceChart />
            <LocationChart />
         </div>
         <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
               Quality & Storage
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
               <VideoQualityChart />
               <AudioFormatChart />
               <MusicAudioFormatChart />
               <LibrarySizeChart />
            </div>
         </div>
      </div>
   );
};

const ChartsFallback = () => (
   <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
         <Skeleton key={i} className="h-[320px] rounded-lg" />
      ))}
   </div>
);

const AnalyticsContent = () => {
   return (
      <>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">Analytics</h1>
               <p className="text-sm text-muted-foreground">
                  Watch patterns and library insights
               </p>
            </div>
            <div className="flex items-center gap-2">
               <PeriodSelector />
               <RefreshButton />
            </div>
         </div>
         <AnalyticsCharts />
      </>
   );
};

const AnalyticsPage = () => {
   return (
      <div className="space-y-6">
         <Suspense
            fallback={
               <>
                  <div className="flex items-center justify-between">
                     <div>
                        <h1 className="text-lg font-semibold">Analytics</h1>
                        <p className="text-sm text-muted-foreground">
                           Watch patterns and library insights
                        </p>
                     </div>
                     <Skeleton className="h-8 w-[140px]" />
                  </div>
                  <ChartsFallback />
               </>
            }
         >
            <AnalyticsContent />
         </Suspense>
      </div>
   );
};
export default AnalyticsPage;
