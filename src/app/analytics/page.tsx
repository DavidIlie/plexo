"use client";

import { BarChart3 } from "lucide-react";

import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { TopGenresChart } from "~/components/analytics/top-genres-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
import { MonthlyTrendsChart } from "~/components/analytics/monthly-trends-chart";
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";

const AnalyticsPage = () => {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
               <BarChart3 className="h-7 w-7 text-primary" />
               Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
               Watch patterns and library insights
            </p>
         </div>

         <div className="grid gap-6 md:grid-cols-2">
            <GenreDistributionChart />
            <TopGenresChart />
            <WatchTimeByDayChart />
            <WatchTimeByHourChart />
            <MonthlyTrendsChart />
            <MediaRatioChart />
         </div>
      </div>
   );
};
export default AnalyticsPage;
