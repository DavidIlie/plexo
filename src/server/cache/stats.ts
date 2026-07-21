import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "~/lib/cache-tags";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getArtists,
   getAlbumCount,
   getTrackCount,
} from "~/lib/plex";
import { getHistory, getPlaysByDate } from "~/lib/tautulli";
import { env } from "~/env";
import { findSection } from "~/lib/plex-sections";
import type {
   WatchActivityData,
   WatchDay,
   WatchWeek,
} from "~/types/watch-activity";

export interface DashboardStats {
   displayName: string;
   totalMovies: number;
   totalShows: number;
   totalArtists: number;
   totalAlbums: number;
   totalTracks: number;
   watchedItems: number;
   hoursWatched: number;
   musicHoursListened: number;
}

export const getDashboardStatsCached = async (): Promise<DashboardStats> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(
      CACHE_TAGS.analytics,
      CACHE_TAGS.analyticsScope("dashboardStats"),
      CACHE_TAGS.plex,
      CACHE_TAGS.tautulli,
   );

   const sections = await getLibrarySections();
   const movieSection = findSection(sections, "movie");
   const showSection = findSection(sections, "show");

   const musicSection = env.SHOW_MUSIC
      ? findSection(sections, "artist")
      : undefined;

   let totalMovies = 0;
   let totalShows = 0;
   let totalArtists = 0;
   let watchedMovies = 0;
   let watchedShows = 0;

   if (movieSection) {
      const movies = await getMovies(movieSection.key);
      totalMovies = movies.totalSize;
      for (const movie of movies.items) {
         if (movie.viewCount && movie.viewCount > 0) {
            watchedMovies++;
         }
      }
   }

   if (showSection) {
      const shows = await getShows(showSection.key);
      totalShows = shows.totalSize;
      for (const show of shows.items) {
         if (
            show.viewedLeafCount &&
            show.leafCount &&
            show.viewedLeafCount >= show.leafCount
         ) {
            watchedShows++;
         }
      }
   }

   let totalAlbums = 0;
   let totalTracks = 0;
   if (musicSection) {
      const [artists, albumCount, trackCount] = await Promise.all([
         getArtists(musicSection.key, 0, 1),
         getAlbumCount(musicSection.key),
         getTrackCount(musicSection.key),
      ]);
      totalArtists = artists.totalSize;
      totalAlbums = albumCount;
      totalTracks = trackCount;
   }

   const history = await getHistory(5000);
   let totalSeconds = 0;
   let musicSeconds = 0;
   for (const item of history.data) {
      totalSeconds += item.play_duration || 0;
      if (item.media_type === "track") {
         musicSeconds += item.play_duration || 0;
      }
   }

   return {
      displayName: env.DISPLAY_NAME,
      totalMovies,
      totalShows,
      totalArtists,
      totalAlbums,
      totalTracks,
      watchedItems: watchedMovies + watchedShows,
      hoursWatched: Math.round(totalSeconds / 3600),
      musicHoursListened: Math.round(musicSeconds / 3600),
   };
};

// Absolute plays/day buckets. Plex watch data is heavily right-skewed —
// most active days have 1-4 plays with the odd binge hitting 10+ — so
// ratio-to-max would collapse nearly every active day into level 1 and wash
// the graph out. Fixed thresholds keyed to plays/day spread typical activity
// across the whole ramp (GitHub's own scale is likewise forgiving).
const watchLevel = (count: number): WatchDay["level"] => {
   if (count <= 0) return 0;
   if (count === 1) return 1;
   if (count <= 3) return 2;
   if (count <= 6) return 3;
   return 4;
};

export const getWatchActivityCached =
   async (): Promise<WatchActivityData> => {
      "use cache";
      cacheLife("analytics");
      cacheTag(
         CACHE_TAGS.analytics,
         CACHE_TAGS.analyticsScope("watchActivity"),
         CACHE_TAGS.tautulli,
      );

      const raw = await getPlaysByDate(365);

      // Fold every series into one daily total per date index.
      const days: { date: string; count: number }[] = raw.categories.map(
         (date, i) => {
            let count = 0;
            for (const series of raw.series) {
               count += series.data[i] ?? 0;
            }
            return { date, count };
         },
      );

      const counts = days.map((d) => d.count);
      const maxCount = Math.max(0, ...counts);
      const total = counts.reduce((sum, c) => sum + c, 0);

      // Build weeks: a new week starts on Sunday (UTC) or at the very first day.
      const weeks: WatchWeek[] = [];
      let current: WatchWeek | null = null;
      let busiestDay: WatchActivityData["busiestDay"] = null;

      for (let i = 0; i < days.length; i++) {
         const { date, count } = days[i]!;
         const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
         const watchDay: WatchDay = {
            date,
            weekday,
            count,
            level: watchLevel(count),
         };

         if (i === 0 || weekday === 0 || current === null) {
            current = { days: [] };
            weeks.push(current);
         }
         current.days.push(watchDay);

         if (count > 0 && (busiestDay === null || count > busiestDay.count)) {
            busiestDay = { date, count };
         }
      }

      // Streaks — pure array walks over the continuous, zero-filled range.
      let longestStreak = 0;
      let run = 0;
      for (const c of counts) {
         if (c > 0) {
            run++;
            if (run > longestStreak) longestStreak = run;
         } else {
            run = 0;
         }
      }

      // Walk backward from the most recent day. Grant grace for the trailing
      // day (today): Tautulli returns a continuous zero-filled range including
      // the current day, so without this an active streak would collapse to 0
      // every midnight until the user watches something that day.
      let currentStreak = 0;
      for (let i = counts.length - 1; i >= 0; i--) {
         if (counts[i]! > 0) currentStreak++;
         else if (i === counts.length - 1) continue;
         else break;
      }

      return {
         weeks,
         total,
         busiestDay,
         currentStreak,
         longestStreak,
         maxCount,
      };
   };
