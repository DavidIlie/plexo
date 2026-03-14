"use client";

import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { TopGenresChart } from "~/components/analytics/top-genres-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
import { MonthlyTrendsChart } from "~/components/analytics/monthly-trends-chart";
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";
import { DeviceChart } from "~/components/analytics/device-chart";
import { LocationChart } from "~/components/analytics/location-chart";

const AnalyticsPage = () => {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-lg font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
               Watch patterns and library insights
            </p>
         </div>

         <div className="grid gap-4 md:grid-cols-2">
            <GenreDistributionChart />
            <TopGenresChart />
            <WatchTimeByDayChart />
            <WatchTimeByHourChart />
            <MonthlyTrendsChart />
            <MediaRatioChart />
            <DeviceChart />
            <LocationChart />
         </div>
      </div>
   );
};
export default AnalyticsPage;
