import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getOnDeck,
   getRecentlyAdded,
   getGenres,
   getMetadata,
   getChildren,
} from "~/lib/plex";

export const plexRouter = createTRPCRouter({
   getLibrarySections: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "plex:sections",
         getLibrarySections,
         CacheTTL.LIBRARY,
      );
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
            CacheTTL.METADATA,
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
            CacheTTL.METADATA,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getOnDeck: publicProcedure.query(async () => {
      const result = await getCachedOrFetch(
         "plex:onDeck",
         getOnDeck,
         CacheTTL.ACTIVITY,
      );
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
            CacheTTL.ACTIVITY,
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
            CacheTTL.LIBRARY,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getMetadata: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `plex:metadata:${input.ratingKey}`,
            () => getMetadata(input.ratingKey),
            CacheTTL.METADATA,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),

   getChildren: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => {
         const result = await getCachedOrFetch(
            `plex:children:${input.ratingKey}`,
            () => getChildren(input.ratingKey),
            CacheTTL.METADATA,
         );
         return {
            data: result.data,
            lastUpdatedAt: result.fetchedAt.toISOString(),
         };
      }),
});
