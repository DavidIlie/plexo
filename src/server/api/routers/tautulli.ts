import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
   getHomeStats,
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
   getMostWatched,
   getGeoipLookup,
} from "~/lib/tautulli";
import { getHistoryWindow, getItemHistoryCached } from "~/server/cache/history";
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
         const data = await getHistoryWindow(
            input.length,
            input.start,
            input.mediaType,
         );
         return { data, lastUpdatedAt: new Date().toISOString() };
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
         const data = await getHistoryWindow(input.limit, start, input.mediaType);
         const total = data.recordsFiltered;
         const nextCursor =
            start + input.limit < total ? start + input.limit : undefined;
         return { items: data.data, total, nextCursor };
      }),

   getHomeStats: publicProcedure.query(async () => {
      const data = await getHomeStats();
      return { data, lastUpdatedAt: new Date().toISOString() };
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
         const data = await getPlaysByDate(input.timeRange, input.yAxis);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getPlaysByDayOfWeek: publicProcedure
      .input(z.object({ timeRange: z.number().default(30) }).default({}))
      .query(async ({ input }) => {
         const data = await getPlaysByDayOfWeek(input.timeRange);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getPlaysByHourOfDay: publicProcedure
      .input(z.object({ timeRange: z.number().default(30) }).default({}))
      .query(async ({ input }) => {
         const data = await getPlaysByHourOfDay(input.timeRange);
         return { data, lastUpdatedAt: new Date().toISOString() };
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
         const data = await getMostWatched(
            input.mediaType,
            input.timeRange,
            input.limit,
         );
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getItemHistory: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => {
         const data = await getItemHistoryCached(input.ratingKey);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   resolveLocations: publicProcedure
      .input(z.object({ ipAddresses: z.array(z.string()) }))
      .query(async ({ input }) => {
         if (!env.SHOW_LOCATIONS) return { data: {} as Record<string, string> };

         const unique = [
            ...new Set(
               input.ipAddresses.filter(
                  (ip) => ip && ip !== "127.0.0.1" && ip !== "::1",
               ),
            ),
         ];

         const results = await Promise.all(
            unique.map(async (ip) => {
               const geo = await getGeoipLookup(ip);
               const parts = [geo.city, geo.country].filter(Boolean);
               return [ip, parts.join(", ")] as const;
            }),
         );

         return { data: Object.fromEntries(results) };
      }),
});
