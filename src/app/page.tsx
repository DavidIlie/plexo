import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { trpc, getQueryClient, HydrateClient } from "~/trpc/server";
import { getDashboardStatsCached } from "~/server/cache/stats";
import { StatCard } from "~/components/dashboard/stat-card";
import { OnDeck } from "~/components/dashboard/on-deck";
import { RecentlyWatched } from "~/components/dashboard/recently-watched";
import { Highlights } from "~/components/dashboard/highlights";
import { Wishlist } from "~/components/dashboard/wishlist";
import { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import { MusicGenreChart } from "~/components/analytics/music-genre-chart";
import { TopArtistsChart } from "~/components/analytics/top-artists-chart";
import { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
import { Skeleton } from "~/components/ui/skeleton";
import { RefreshButton } from "~/components/refresh-button";

export const generateMetadata = async (): Promise<Metadata> => {
   const data = await getDashboardStatsCached();
   const parts = [
      `${data.totalMovies} movies`,
      `${data.totalShows} shows`,
   ];
   if (data.totalArtists > 0) parts.push(`${data.totalArtists} artists`);
   parts.push(`${data.hoursWatched.toLocaleString()} hours watched`);
   const desc = parts.join(", ");
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
   const data = await getDashboardStatsCached();

   return (
      <div>
         <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">
               {data.displayName}&apos;s Library
            </h1>
            <RefreshButton />
         </div>
         <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon="Film" label="Movies" value={data.totalMovies} index={0} />
            <StatCard icon="Tv" label="Shows" value={data.totalShows} index={1} />
            <StatCard icon="Eye" label="Watched" value={data.watchedItems} index={2} />
            <StatCard
               icon="Clock"
               label="Hours Watched"
               value={data.hoursWatched.toLocaleString()}
               index={3}
            />
            {data.totalArtists > 0 && (
               <>
                  <StatCard icon="Music" label="Artists" value={data.totalArtists} index={4} />
                  <StatCard icon="Library" label="Albums" value={data.totalAlbums} index={5} />
                  <StatCard icon="Disc3" label="Tracks" value={data.totalTracks} index={6} />
                  {data.musicHoursListened > 0 && (
                     <StatCard
                        icon="Clock"
                        label="Hours Listened"
                        value={data.musicHoursListened.toLocaleString()}
                        index={7}
                     />
                  )}
               </>
            )}
         </div>
      </div>
   );
};

const StatsFallback = () => (
   <div>
      <div className="mb-4 flex items-center justify-between">
         <Skeleton className="h-6 w-40" />
         <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
         {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
         ))}
      </div>
   </div>
);

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

const DashboardBody = async () => {
   // Defer the live data sections to request time. Their server-side prefetches
   // run getCachedOrFetch / stamp timestamps, which can't happen during the
   // static prerender — connection() marks this subtree dynamic so it streams
   // into the static shell as an App-Shell hole.
   await connection();

   const queryClient = getQueryClient();
   void queryClient.prefetchQuery(trpc.plex.getOnDeck.queryOptions());
   void queryClient.prefetchQuery(
      trpc.tautulli.getHistory.queryOptions({ length: 10 }),
   );
   void queryClient.prefetchQuery(trpc.analytics.getHighlights.queryOptions());
   void queryClient.prefetchQuery(trpc.recommend.getWishlist.queryOptions());

   return (
      <HydrateClient>
         <Suspense fallback={<SectionFallback />}>
            <Highlights />
         </Suspense>

         <Suspense fallback={<SectionFallback />}>
            <OnDeck />
         </Suspense>

         <Suspense fallback={null}>
            <Wishlist />
         </Suspense>

         <div>
            <div className="mb-3 flex items-center justify-between">
               <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  What I Watch
               </h2>
               <Link
                  href="/analytics"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
               >
                  All analytics
                  <ArrowRight className="h-3 w-3" />
               </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
               <GenreDistributionChart />
               <WatchTimeByHourChart />
               <MusicGenreChart />
               <TopArtistsChart />
            </div>
         </div>

         <Suspense fallback={<Skeleton className="h-64" />}>
            <RecentlyWatched />
         </Suspense>
      </HydrateClient>
   );
};

const DashboardPage = () => {
   return (
      <div className="space-y-8">
         <Suspense fallback={<StatsFallback />}>
            <DashboardStats />
         </Suspense>
         <Suspense fallback={<SectionFallback />}>
            <DashboardBody />
         </Suspense>
      </div>
   );
};
export default DashboardPage;
