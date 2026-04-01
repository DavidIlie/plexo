import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import {
   getHistory,
   getHomeStats,
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
   getMostWatched,
   getGeoipLookup,
} from "~/lib/tautulli";
import { env } from "~/env";

export const tautulliRouter = createTRPCRouter({
   getHistory: publicProcedure
      .input(
         z
            .object({
               length: z.number().default(10),
               start: z.number().default(0),
               mediaType: z.string().optional(),
            })
            .default({}),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `tautulli:history:${input.length}:${input.start}:${input.mediaType ?? "all"}`,
            () => getHistory(input.length, input.start, input.mediaType),
            CacheTTL.ACTIVITY,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   browseHistory: publicProcedure
      .input(
         z.object({
            cursor: z.number().nullish(),
            limit: z.number().default(30),
            mediaType: z.string().optional(),
         }),
      )
      .query(async ({ input }) => {
         const start = input.cursor ?? 0;
         const mediaTypeKey = input.mediaType ?? "all";
         const result = await getCachedOrFetch(
            `tautulli:history:${input.limit}:${start}:${mediaTypeKey}`,
            () => getHistory(input.limit, start, input.mediaType),
            CacheTTL.ACTIVITY,
         );
         const total = result.data.recordsFiltered;
         const nextCursor = start + input.limit < total
            ? start + input.limit
            : undefined;
         return {
            items: result.data.data,
            total,
            nextCursor,
         };
      }),

   getHomeStats: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "tautulli:homeStats",
         getHomeStats,
         CacheTTL.ACTIVITY,
      );
      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getPlaysByDate: publicProcedure
      .input(
         z
            .object({
               timeRange: z.number().default(30),
               yAxis: z.string().default("plays"),
            })
            .default({}),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `tautulli:playsByDate:${input.timeRange}:${input.yAxis}`,
            () => getPlaysByDate(input.timeRange, input.yAxis),
            CacheTTL.ANALYTICS,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getPlaysByDayOfWeek: publicProcedure
      .input(
         z
            .object({
               timeRange: z.number().default(30),
            })
            .default({}),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `tautulli:playsByDayOfWeek:${input.timeRange}`,
            () => getPlaysByDayOfWeek(input.timeRange),
            CacheTTL.ANALYTICS,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getPlaysByHourOfDay: publicProcedure
      .input(
         z
            .object({
               timeRange: z.number().default(30),
            })
            .default({}),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `tautulli:playsByHourOfDay:${input.timeRange}`,
            () => getPlaysByHourOfDay(input.timeRange),
            CacheTTL.ANALYTICS,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getMostWatched: publicProcedure
      .input(
         z
            .object({
               mediaType: z.string().default("movie"),
               timeRange: z.number().default(30),
               limit: z.number().default(10),
            })
            .default({}),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `tautulli:mostWatched:${input.mediaType}:${input.timeRange}:${input.limit}`,
            () =>
               getMostWatched(input.mediaType, input.timeRange, input.limit),
            CacheTTL.ANALYTICS,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getItemHistory: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `tautulli:itemHistory:${input.ratingKey}`,
            async () => {
               const history = await getHistory(200);
               return history.data.filter(
                  (item) =>
                     String(item.rating_key) === input.ratingKey ||
                     String(item.grandparent_rating_key) === input.ratingKey,
               );
            },
            CacheTTL.ACTIVITY,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   resolveLocations: publicProcedure
      .input(z.object({ ipAddresses: z.array(z.string()) }))
      .query(async ({ input }) => {
         if (!env.SHOW_LOCATIONS) return { data: {} as Record<string, string> };

         const unique = [...new Set(input.ipAddresses.filter(
            (ip) => ip && ip !== "127.0.0.1" && ip !== "::1",
         ))];

         const results = await Promise.all(
            unique.map(async (ip) => {
               const geo = await getCachedOrFetch(
                  `geo:${ip}`,
                  () => getGeoipLookup(ip),
                  CacheTTL.LIBRARY,
               );
               const parts = [geo.data.city, geo.data.country].filter(Boolean);
               return [ip, parts.join(", ")] as const;
            }),
         );

         return { data: Object.fromEntries(results) };
      }),
});
