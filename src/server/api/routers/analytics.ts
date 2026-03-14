import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch } from "~/lib/cache";
import { getLibrarySections, getMovies, getShows } from "~/lib/plex";
import {
   getHistory,
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
} from "~/lib/tautulli";

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
            let totalDurationMs = 0;

            if (movieSection) {
               const movies = await getMovies(movieSection.key);
               totalMovies = movies.totalSize;
               for (const movie of movies.items) {
                  if (movie.viewCount && movie.viewCount > 0) {
                     watchedMovies++;
                  }
                  if (movie.duration) {
                     totalDurationMs += movie.duration;
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
               totalMovies,
               totalShows,
               watchedItems: watchedMovies + watchedShows,
               hoursWatched: totalHoursWatched,
            };
         },
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
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getWatchTimeByDay: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:watchTimeByDay",
         async () => {
            const data = await getPlaysByDayOfWeek(30);
            return data;
         },
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getWatchTimeByHour: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:watchTimeByHour",
         async () => {
            const data = await getPlaysByHourOfDay(30);
            return data;
         },
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getMonthlyTrends: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "analytics:monthlyTrends",
         async () => {
            const data = await getPlaysByDate(365);
            return data;
         },
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
      );

      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),
});
