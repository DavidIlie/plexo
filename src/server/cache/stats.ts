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
import { getHistory } from "~/lib/tautulli";
import { env } from "~/env";

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

/**
 * Library + watch totals shown in the dashboard header and in every page's
 * metadata. Cached remotely so it is shared across instances and can be served
 * inside the static App Shell. Called directly from `generateMetadata` (which
 * must not introduce non-deterministic values like a served-at timestamp) and
 * from the tRPC resolver (which adds `lastUpdatedAt`).
 */
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
   const movieSection = sections.find((s) => s.type === "movie");
   const showSection = sections.find((s) => s.type === "show");

   const musicSection = env.SHOW_MUSIC
      ? sections.find((s) => s.type === "artist")
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
