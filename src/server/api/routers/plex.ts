import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch } from "~/lib/cache";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getOnDeck,
   getRecentlyAdded,
   getGenres,
} from "~/lib/plex";

export const plexRouter = createTRPCRouter({
   getLibrarySections: publicProcedure.query(async () => {
      const result = await getCachedOrFetch("plex:sections", getLibrarySections);
      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getMovies: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            start: z.number().default(0),
            size: z.number().default(500),
         }),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `plex:movies:${input.sectionId}:${input.start}:${input.size}`,
            () => getMovies(input.sectionId, input.start, input.size),
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getShows: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            start: z.number().default(0),
            size: z.number().default(500),
         }),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `plex:shows:${input.sectionId}:${input.start}:${input.size}`,
            () => getShows(input.sectionId, input.start, input.size),
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getOnDeck: publicProcedure.query(async () => {
      const result = await getCachedOrFetch("plex:onDeck", getOnDeck);
      return {
         data: result.data,
         lastUpdatedAt: result.fetchedAt.toISOString(),
      };
   }),

   getRecentlyAdded: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            count: z.number().default(20),
         }),
      )
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `plex:recentlyAdded:${input.sectionId}:${input.count}`,
            () => getRecentlyAdded(input.sectionId, input.count),
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getGenres: publicProcedure
      .input(z.object({ sectionId: z.string() }))
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `plex:genres:${input.sectionId}`,
            () => getGenres(input.sectionId),
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),
});
