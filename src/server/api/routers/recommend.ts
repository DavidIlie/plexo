import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import { searchMedia } from "~/lib/tmdb";
import { verifyTurnstile } from "~/lib/turnstile";
import { sendRecommendation, sendTestNotification } from "~/lib/notify";
import { checkRateLimit, resetRateLimitKey } from "~/lib/rate-limit";
import { getLibrarySections, getMovies, getShows, getWatchlist as getPlexWatchlist } from "~/lib/plex";
import { createRequest as createOverseerrRequest } from "~/lib/overseerr";
import { getWishlist } from "~/lib/overseerr";
import { env } from "~/env";

const HOUR_MS = 60 * 60 * 1000;

const normalizeTitle = (title: string) =>
   title.toLowerCase().replace(/[^a-z0-9]/g, "");

const getLibraryTitles = async (): Promise<Set<string>> => {
   const result = await getCachedOrFetch(
      "recommend:libraryTitles",
      async () => {
         const sections = await getLibrarySections();
         const movieSection = sections.find((s) => s.type === "movie");
         const showSection = sections.find((s) => s.type === "show");

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
      },
      CacheTTL.METADATA,
   );

   return new Set(result.data);
};

export const recommendRouter = createTRPCRouter({
   search: publicProcedure
      .input(z.object({ query: z.string().min(1).max(200) }))
      .query(async ({ input }) => {
         if (!env.RECOMMEND_ENABLED || !env.TMDB_API_KEY) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Recommendations are not enabled",
            });
         }

         const [searchResult, libraryTitles] = await Promise.all([
            getCachedOrFetch(
               `tmdb:search:${input.query.toLowerCase().trim()}`,
               () => searchMedia(input.query),
               CacheTTL.ACTIVITY,
            ),
            getLibraryTitles(),
         ]);

         const results = searchResult.data.map((item) => {
            const title = item.title ?? item.name ?? "";
            const year =
               (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? "";
            const inLibrary = libraryTitles.has(
               `${normalizeTitle(title)}|${year}`,
            );
            return { ...item, inLibrary };
         });

         return { data: results, lastUpdatedAt: searchResult.fetchedAt.toISOString() };
      }),

   submit: publicProcedure
      .input(
         z.object({
            tmdbId: z.number(),
            title: z.string(),
            mediaType: z.enum(["movie", "tv"]),
            year: z.string(),
            posterPath: z.string().nullable(),
            senderName: z.string().min(1).max(100),
            message: z.string().max(500).optional(),
            turnstileToken: z.string().optional(),
         }),
      )
      .mutation(async ({ input, ctx }) => {
         if (!env.RECOMMEND_ENABLED) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Recommendations are not enabled",
            });
         }

         const ip =
            ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "anonymous";
         const { allowed } = checkRateLimit(`recommend:${ip}`, HOUR_MS, 5);

         if (!allowed) {
            throw new TRPCError({
               code: "TOO_MANY_REQUESTS",
               message: "Too many recommendations. Please try again later.",
            });
         }

         if (input.turnstileToken) {
            const valid = await verifyTurnstile(input.turnstileToken);
            if (!valid) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Captcha verification failed",
               });
            }
         }

         await sendRecommendation({
            tmdbId: input.tmdbId,
            title: input.title,
            mediaType: input.mediaType,
            year: input.year,
            posterPath: input.posterPath,
            senderName: input.senderName,
            message: input.message,
         });

         if (env.OVERSEERR_URL && env.OVERSEERR_API_KEY) {
            try {
               await createOverseerrRequest(input.tmdbId, input.mediaType);
            } catch {
               // Overseerr request is best-effort
            }
         }

         return { success: true };
      }),

   resetRateLimit: publicProcedure
      .input(z.object({ turnstileToken: z.string() }))
      .mutation(async ({ input, ctx }) => {
         if (!env.TURNSTILE_SECRET_KEY) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Turnstile is not configured",
            });
         }

         const valid = await verifyTurnstile(input.turnstileToken);
         if (!valid) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Captcha verification failed",
            });
         }

         const ip =
            ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "anonymous";
         resetRateLimitKey(`recommend:${ip}`);

         return { success: true };
      }),

   getWishlist: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "recommend:wishlist",
         async () => {
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

            // Deduplicate by title+year, prefer Overseerr entries
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
         },
         CacheTTL.ACTIVITY,
      );

      return { data: result.data, lastUpdatedAt: result.fetchedAt.toISOString() };
   }),

   testNotification: publicProcedure
      .input(
         z.object({
            channel: z.enum(["discord", "email"]),
            secret: z.string(),
            turnstileToken: z.string().optional(),
         }),
      )
      .mutation(async ({ input }) => {
         if (input.secret !== env.REFRESH_SECRET) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "Invalid admin secret",
            });
         }

         if (env.TURNSTILE_SECRET_KEY && input.turnstileToken) {
            const valid = await verifyTurnstile(input.turnstileToken);
            if (!valid) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Captcha verification failed",
               });
            }
         }

         await sendTestNotification(input.channel);

         return { success: true };
      }),
});
