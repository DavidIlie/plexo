import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "~/lib/cache-tags";
import { searchMedia } from "~/lib/tmdb";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getWatchlist as getPlexWatchlist,
} from "~/lib/plex";
import { getWishlist } from "~/lib/overseerr";
import { env } from "~/env";
import { normalizeTitle } from "~/lib/media-match";
import { findSection } from "~/lib/plex-sections";

export const getLibraryTitlesCached = async (): Promise<string[]> => {
   "use cache";
   cacheLife("metadata");
   cacheTag(
      CACHE_TAGS.recommend,
      CACHE_TAGS.recommendLibraryTitles,
      CACHE_TAGS.plex,
   );

   const sections = await getLibrarySections();
   const movieSection = findSection(sections, "movie");
   const showSection = findSection(sections, "show");

   const titles = new Set<string>();

   if (movieSection) {
      const movies = await getMovies(movieSection.key);
      for (const m of movies.items) {
         titles.add(`${normalizeTitle(m.title)}|${m.year ?? ""}`);
      }
   }

   if (showSection) {
      const shows = await getShows(showSection.key);
      for (const s of shows.items) {
         titles.add(`${normalizeTitle(s.title)}|${s.year ?? ""}`);
      }
   }

   return [...titles];
};

export const searchTmdbCached = async (query: string) => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tmdb, CACHE_TAGS.tmdbSearch);
   return searchMedia(query);
};

export const getWishlistCached = async () => {
   "use cache";
   cacheLife("activity");
   cacheTag(
      CACHE_TAGS.recommend,
      CACHE_TAGS.recommendWishlist,
      CACHE_TAGS.overseerr,
   );

   const [overseerrItems, plexItems] = await Promise.all([
      env.OVERSEERR_URL && env.OVERSEERR_API_KEY
         ? getWishlist().catch(() => [])
         : Promise.resolve([]),
      getPlexWatchlist().catch(() => []),
   ]);

   const plexWishlistItems = plexItems.map((item) => ({
      id: `plex-${item.ratingKey}`,
      title: item.title,
      year: String(item.year ?? ""),
      mediaType: (item.type === "movie" ? "movie" : "tv") as "movie" | "tv",
      posterPath: item.thumb ?? null,
      source: "plex" as const,
      status: "watchlist" as const,
      requestedBy: null,
      requestedAt: null,
   }));

   const overseerrWishlistItems = overseerrItems.map((item) => ({
      id: `overseerr-${item.tmdbId}`,
      title: item.title,
      year: item.year,
      mediaType: item.mediaType,
      posterPath: item.posterPath,
      source: "overseerr" as const,
      status: item.status,
      requestedBy: item.requestedBy,
      requestedAt: item.requestedAt,
   }));

   const seen = new Set<string>();
   const merged = [];

   for (const item of overseerrWishlistItems) {
      const key = `${normalizeTitle(item.title)}|${item.year}`;
      seen.add(key);
      merged.push(item);
   }

   for (const item of plexWishlistItems) {
      const key = `${normalizeTitle(item.title)}|${item.year}`;
      if (!seen.has(key)) {
         merged.push(item);
      }
   }

   return merged;
};
