import { Film, Tv, Eye, Clock, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

import { trpc, caller, getQueryClient, HydrateClient } from "~/trpc/server";
import { StatCard } from "~/components/dashboard/stat-card";
import { OnDeck } from "~/components/dashboard/on-deck";
import { RecentlyWatched } from "~/components/dashboard/recently-watched";
import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { Button } from "~/components/ui/button";

const DashboardStats = async () => {
   const { data } = await caller.analytics.getDashboardStats();

   return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
         <StatCard icon={Film} label="Total Movies" value={data.totalMovies} />
         <StatCard icon={Tv} label="Total Shows" value={data.totalShows} />
         <StatCard icon={Eye} label="Watched" value={data.watchedItems} />
         <StatCard
            icon={Clock}
            label="Hours Watched"
            value={data.hoursWatched.toLocaleString()}
         />
      </div>
   );
};

const DashboardPage = async () => {
   const queryClient = getQueryClient();
   void queryClient.prefetchQuery(
      trpc.analytics.getDashboardStats.queryOptions(),
   );
   void queryClient.prefetchQuery(trpc.plex.getOnDeck.queryOptions());
   void queryClient.prefetchQuery(
      trpc.tautulli.getHistory.queryOptions({ length: 10 }),
   );

   return (
      <HydrateClient>
         <div className="space-y-8">
            <div>
               <h1 className="flex items-center gap-2 text-2xl font-bold">
                  <Film className="h-7 w-7 text-primary" />
                  David&apos;s Media Dashboard
               </h1>
               <p className="mt-1 text-sm text-muted-foreground">
                  Your personal Plex library at a glance
               </p>
            </div>

            <DashboardStats />
            <OnDeck />

            <div className="grid gap-6 lg:grid-cols-2">
               <RecentlyWatched />
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Quick Insights
                     </h2>
                     <Button variant="ghost" size="sm" asChild>
                        <Link
                           href="/analytics"
                           className="text-muted-foreground"
                        >
                           View all
                           <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                     </Button>
                  </div>
                  <GenreDistributionChart />
               </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
               <WatchTimeByDayChart />
               <MediaRatioChart />
            </div>
         </div>
      </HydrateClient>
   );
};
export default DashboardPage;
