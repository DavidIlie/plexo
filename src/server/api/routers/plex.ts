import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
   getLibrarySections,
   getMovies,
   getShows,
   getArtists,
   getOnDeck,
   getRecentlyAdded,
   getGenres,
   getMetadata,
   getChildren,
} from "~/lib/plex";

// All lib fetchers below are 'use cache: remote' (keyed on their args), so the
// router procedures are thin: call the cached fetcher and stamp the served-at
// time. The static import lib functions own caching, tags, and revalidation.
export const plexRouter = createTRPCRouter({
   getLibrarySections: publicProcedure.query(async () => {
      const data = await getLibrarySections();
      return { data, lastUpdatedAt: new Date().toISOString() };
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
         const data = await getMovies(input.sectionId, input.start, input.size);
         return { data, lastUpdatedAt: new Date().toISOString() };
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
         const data = await getShows(input.sectionId, input.start, input.size);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getArtists: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            start: z.number().default(0),
            size: z.number().default(500),
         }),
      )
      .query(async ({ input }) => {
         const data = await getArtists(input.sectionId, input.start, input.size);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   browseMovies: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            cursor: z.number().nullish(),
            limit: z.number().default(60),
         }),
      )
      .query(async ({ input }) => {
         const start = input.cursor ?? 0;
         const data = await getMovies(input.sectionId, start, input.limit);
         const nextCursor =
            start + input.limit < data.totalSize ? start + input.limit : undefined;
         return { items: data.items, totalSize: data.totalSize, nextCursor };
      }),

   browseShows: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            cursor: z.number().nullish(),
            limit: z.number().default(60),
         }),
      )
      .query(async ({ input }) => {
         const start = input.cursor ?? 0;
         const data = await getShows(input.sectionId, start, input.limit);
         const nextCursor =
            start + input.limit < data.totalSize ? start + input.limit : undefined;
         return { items: data.items, totalSize: data.totalSize, nextCursor };
      }),

   browseArtists: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            cursor: z.number().nullish(),
            limit: z.number().default(60),
         }),
      )
      .query(async ({ input }) => {
         const start = input.cursor ?? 0;
         const data = await getArtists(input.sectionId, start, input.limit);
         const nextCursor =
            start + input.limit < data.totalSize ? start + input.limit : undefined;
         return { items: data.items, totalSize: data.totalSize, nextCursor };
      }),

   getOnDeck: publicProcedure.query(async () => {
      const data = await getOnDeck();
      return { data, lastUpdatedAt: new Date().toISOString() };
   }),

   getRecentlyAdded: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            count: z.number().default(20),
         }),
      )
      .query(async ({ input }) => {
         const data = await getRecentlyAdded(input.sectionId, input.count);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getGenres: publicProcedure
      .input(z.object({ sectionId: z.string() }))
      .query(async ({ input }) => {
         const data = await getGenres(input.sectionId);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getMetadata: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => {
         const data = await getMetadata(input.ratingKey);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),

   getChildren: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => {
         const data = await getChildren(input.ratingKey);
         return { data, lastUpdatedAt: new Date().toISOString() };
      }),
});
