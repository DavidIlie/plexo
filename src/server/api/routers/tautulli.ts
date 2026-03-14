import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch } from "~/lib/cache";
import {
   getHistory,
   getHomeStats,
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
   getMostWatched,
} from "~/lib/tautulli";

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
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getHomeStats: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "tautulli:homeStats",
         getHomeStats,
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
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),
});
