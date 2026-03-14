import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import { getLibrarySections, getMovies, getShows } from "~/lib/plex";
import {
   getHistory,
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
   getGeoipLookup,
} from "~/lib/tautulli";
import { env } from "~/env";

export const analyticsRouter = createTRPCRouter({
   getDashboardStats: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:dashboardStats",
         async () => {
            const sections = await getLibrarySections();
            const movieSection = sections.find((s) => s.type === "movie");
            const showSection = sections.find((s) => s.type === "show");

            let totalMovies = 0;
            let totalShows = 0;
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

            const history = await getHistory(1000);
            const totalHoursWatched = Math.round(
               parseInt(history.total_duration) / 3600,
            );

            return {
               displayName: env.DISPLAY_NAME,
               totalMovies,
               totalShows,
               watchedItems: watchedMovies + watchedShows,
               hoursWatched: totalHoursWatched,
            };
         },
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getGenreDistribution: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:genreDistribution",
         async () => {
            const sections = await getLibrarySections();
            const genreCounts = new Map<string, number>();

            for (const section of sections) {
               if (section.type !== "movie" && section.type !== "show") continue;
               const items =
                  section.type === "movie"
                     ? await getMovies(section.key)
                     : await getShows(section.key);

               for (const item of items.items) {
                  if (item.Genre) {
                     for (const genre of item.Genre) {
                        genreCounts.set(
                           genre.tag,
                           (genreCounts.get(genre.tag) ?? 0) + 1,
                        );
                     }
                  }
               }
            }

            return Array.from(genreCounts.entries())
               .map(([name, count]) => ({ name, count }))
               .sort((a, b) => b.count - a.count)
               .slice(0, 15);
         },
         CacheTTL.METADATA,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getTopWatchedGenres: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:topWatchedGenres",
         async () => {
            const history = await getHistory(500);
            const sections = await getLibrarySections();
            const movieSection = sections.find((s) => s.type === "movie");
            const showSection = sections.find((s) => s.type === "show");

            const allItems = new Map<string, string[]>();

            if (movieSection) {
               const movies = await getMovies(movieSection.key);
               for (const movie of movies.items) {
                  if (movie.Genre) {
                     allItems.set(
                        movie.ratingKey,
                        movie.Genre.map((g) => g.tag),
                     );
                  }
               }
            }

            if (showSection) {
               const shows = await getShows(showSection.key);
               for (const show of shows.items) {
                  if (show.Genre) {
                     allItems.set(
                        show.ratingKey,
                        show.Genre.map((g) => g.tag),
                     );
                  }
               }
            }

            const genrePlayCounts = new Map<string, number>();
            for (const histItem of history.data) {
               const key = String(
                  histItem.grandparent_rating_key || histItem.rating_key,
               );
               const genres = allItems.get(key);
               if (genres) {
                  for (const genre of genres) {
                     genrePlayCounts.set(
                        genre,
                        (genrePlayCounts.get(genre) ?? 0) + 1,
                     );
                  }
               }
            }

            return Array.from(genrePlayCounts.entries())
               .map(([name, plays]) => ({ name, plays }))
               .sort((a, b) => b.plays - a.plays)
               .slice(0, 10);
         },
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getWatchTimeByDay: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:watchTimeByDay",
         () => getPlaysByDayOfWeek(30),
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getWatchTimeByHour: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:watchTimeByHour",
         () => getPlaysByHourOfDay(30),
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getMonthlyTrends: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:monthlyTrends",
         () => getPlaysByDate(365),
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getMediaTypeRatio: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:mediaTypeRatio",
         async () => {
            const history = await getHistory(1000);

            let moviePlays = 0;
            let tvPlays = 0;

            for (const item of history.data) {
               if (item.media_type === "movie") {
                  moviePlays++;
               } else if (
                  item.media_type === "episode" ||
                  item.media_type === "show"
               ) {
                  tvPlays++;
               }
            }

            return [
               { name: "Movies", value: moviePlays },
               { name: "TV Shows", value: tvPlays },
            ];
         },
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getHighlights: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:highlights",
         async () => {
            const history = await getHistory(5000);
            const sections = await getLibrarySections();
            const movieSection = sections.find((s) => s.type === "movie");
            const showSection = sections.find((s) => s.type === "show");

            const playCounts = new Map<string, { ratingKey: string; title: string; plays: number; type: string; thumb: string }>();
            for (const item of history.data) {
               const key = String(item.grandparent_rating_key || item.rating_key);
               const title = item.grandparent_title || item.title;
               const existing = playCounts.get(key);
               if (existing) {
                  existing.plays++;
               } else {
                  playCounts.set(key, {
                     ratingKey: key,
                     title,
                     plays: 1,
                     type: item.media_type,
                     thumb: item.grandparent_thumb || item.thumb,
                  });
               }
            }

            const sorted = Array.from(playCounts.values()).sort(
               (a, b) => b.plays - a.plays,
            );

            const mostWatched = sorted[0] ?? null;

            const rewatched = sorted.filter((i) => i.plays > 1);
            const mostRewatched = rewatched.length > 0 ? rewatched[0] : null;

            let longestMovie: { ratingKey: string; title: string; duration: number; thumb: string } | null = null;
            if (movieSection) {
               const movies = await getMovies(movieSection.key);
               for (const movie of movies.items) {
                  if (movie.duration && (!longestMovie || movie.duration > longestMovie.duration)) {
                     longestMovie = {
                        ratingKey: movie.ratingKey,
                        title: movie.title,
                        duration: Math.round(movie.duration / 60000),
                        thumb: movie.thumb ?? "",
                     };
                  }
               }
            }

            let totalEpisodes = 0;
            if (showSection) {
               const shows = await getShows(showSection.key);
               for (const show of shows.items) {
                  totalEpisodes += show.leafCount ?? 0;
               }
            }

            const totalPlays = history.data.length;

            const daysWatched = new Set(
               history.data.map((i) => {
                  const d = new Date(i.stopped * 1000);
                  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
               }),
            ).size;

            let topDevice: { name: string; plays: number } | null = null;
            if (env.SHOW_DEVICES) {
               const deviceCounts = new Map<string, number>();
               for (const item of history.data) {
                  const dev = item.platform || item.product || "Unknown";
                  deviceCounts.set(dev, (deviceCounts.get(dev) ?? 0) + 1);
               }
               let maxPlays = 0;
               for (const [name, plays] of deviceCounts) {
                  if (plays > maxPlays) {
                     maxPlays = plays;
                     topDevice = { name, plays };
                  }
               }
            }

            let topLocation: string | null = null;
            if (env.SHOW_LOCATIONS) {
               const ips = new Set<string>();
               for (const item of history.data) {
                  if (item.ip_address && item.ip_address !== "127.0.0.1") {
                     ips.add(item.ip_address);
                  }
               }
               if (ips.size > 0) {
                  const firstIp = Array.from(ips)[0];
                  try {
                     const geo = await getGeoipLookup(firstIp);
                     if (geo.city && geo.country) {
                        topLocation = `${geo.city}, ${geo.country}`;
                     }
                  } catch {
                     // ignore
                  }
               }
            }

            return {
               mostWatched,
               mostRewatched,
               longestMovie,
               totalEpisodes,
               totalPlays,
               daysWithActivity: daysWatched,
               avgPlaysPerDay:
                  daysWatched > 0
                     ? Math.round((totalPlays / daysWatched) * 10) / 10
                     : 0,
               topDevice,
               topLocation,
            };
         },
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getDeviceStats: publicProcedure.query(async () => {
      if (!env.SHOW_DEVICES) {
         return { data: null, lastUpdatedAt: new Date().toISOString() };
      }

      const result = await getCachedOrFetch(
         "analytics:deviceStats",
         async () => {
            const history = await getHistory(2000);
            const platforms = new Map<string, { plays: number; lastUsed: number }>();

            for (const item of history.data) {
               const key = item.platform || item.product || "Unknown";
               const existing = platforms.get(key);
               if (existing) {
                  existing.plays++;
                  existing.lastUsed = Math.max(existing.lastUsed, item.stopped);
               } else {
                  platforms.set(key, { plays: 1, lastUsed: item.stopped });
               }
            }

            return Array.from(platforms.entries())
               .map(([name, stats]) => ({
                  name,
                  plays: stats.plays,
                  lastUsed: stats.lastUsed,
               }))
               .sort((a, b) => b.plays - a.plays);
         },
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getLocationStats: publicProcedure.query(async () => {
      if (!env.SHOW_LOCATIONS) {
         return { data: null, lastUpdatedAt: new Date().toISOString() };
      }

      const result = await getCachedOrFetch(
         "analytics:locationStats",
         async () => {
            const history = await getHistory(500);
            const uniqueIps = new Set<string>();

            for (const item of history.data) {
               if (item.ip_address && item.ip_address !== "127.0.0.1") {
                  uniqueIps.add(item.ip_address);
               }
            }

            const locations = new Map<string, number>();

            for (const ip of uniqueIps) {
               try {
                  const geo = await getGeoipLookup(ip);
                  if (geo.city && geo.country) {
                     const key = `${geo.city}, ${geo.country}`;
                     locations.set(key, (locations.get(key) ?? 0) + 1);
                  }
               } catch {
                  // skip failed lookups
               }
            }

            return Array.from(locations.entries())
               .map(([location, count]) => ({ location, count }))
               .sort((a, b) => b.count - a.count);
         },
         CacheTTL.ANALYTICS,
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),
});
