import { Suspense } from "react";
import { Film, Tv, Eye, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { trpc, caller, getQueryClient, HydrateClient } from "~/trpc/server";
import { StatCard } from "~/components/dashboard/stat-card";
import { OnDeck } from "~/components/dashboard/on-deck";
import { RecentlyWatched } from "~/components/dashboard/recently-watched";
import { Highlights } from "~/components/dashboard/highlights";
import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { MediaRatioChart } from "~/components/analytics/media-ratio-chart";
import { WatchTimeByDayChart } from "~/components/analytics/watch-time-by-day-chart";
import { Skeleton } from "~/components/ui/skeleton";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   const desc = `${data.totalMovies} movies, ${data.totalShows} shows, ${data.hoursWatched.toLocaleString()} hours watched`;
   return {
      title: `${data.displayName}'s Library | Plexo`,
      description: desc,
      openGraph: {
         title: `${data.displayName}'s Library`,
         description: desc,
         images: [{ url: "/og?page=dashboard", width: 1200, height: 630 }],
      },
      twitter: {
         card: "summary_large_image",
         title: `${data.displayName}'s Library`,
         description: desc,
         images: ["/og?page=dashboard"],
      },
   };
};

const DashboardStats = async () => {
   const { data } = await caller.analytics.getDashboardStats();

   return (
      <div>
         <h1 className="mb-4 text-lg font-semibold">
            {data.displayName}&apos;s Library
         </h1>
         <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Film} label="Movies" value={data.totalMovies} />
            <StatCard icon={Tv} label="Shows" value={data.totalShows} />
            <StatCard icon={Eye} label="Watched" value={data.watchedItems} />
            <StatCard
               icon={Clock}
               label="Hours Watched"
               value={data.hoursWatched.toLocaleString()}
            />
         </div>
      </div>
   );
};

const SectionFallback = () => (
   <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
         {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
         ))}
      </div>
   </div>
);

const DashboardPage = async () => {
   const queryClient = getQueryClient();
   void queryClient.prefetchQuery(
      trpc.analytics.getDashboardStats.queryOptions(),
   );
   void queryClient.prefetchQuery(trpc.plex.getOnDeck.queryOptions());
   void queryClient.prefetchQuery(
      trpc.tautulli.getHistory.queryOptions({ length: 10 }),
   );
   void queryClient.prefetchQuery(
      trpc.analytics.getHighlights.queryOptions(),
   );

   return (
      <HydrateClient>
         <div className="space-y-10">
            <DashboardStats />

            <Suspense fallback={<SectionFallback />}>
               <Highlights />
            </Suspense>

            <Suspense fallback={<SectionFallback />}>
               <OnDeck />
            </Suspense>

            <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
               <Suspense fallback={<Skeleton className="h-64" />}>
                  <RecentlyWatched />
               </Suspense>

               <div>
                  <div className="mb-3 flex items-center justify-between">
                     <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Insights
                     </h2>
                     <Link
                        href="/analytics"
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                     >
                        All analytics
                        <ArrowRight className="h-3 w-3" />
                     </Link>
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
