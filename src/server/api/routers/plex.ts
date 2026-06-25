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
import { browseInput, paginateSection, stamp } from "~/server/api/helpers";

const paginatedBrowse = (
   fetch: typeof getMovies,
) =>
   publicProcedure.input(browseInput).query(async ({ input }) => {
      const start = input.cursor ?? 0;
      const data = await fetch(input.sectionId, start, input.limit);
      return paginateSection(start, input.limit, data);
   });

export const plexRouter = createTRPCRouter({
   getLibrarySections: publicProcedure.query(async () =>
      stamp(await getLibrarySections()),
   ),

   getMovies: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            start: z.number().default(0),
            size: z.number().default(500),
         }),
      )
      .query(async ({ input }) =>
         stamp(await getMovies(input.sectionId, input.start, input.size)),
      ),

   getShows: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            start: z.number().default(0),
            size: z.number().default(500),
         }),
      )
      .query(async ({ input }) =>
         stamp(await getShows(input.sectionId, input.start, input.size)),
      ),

   getArtists: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            start: z.number().default(0),
            size: z.number().default(500),
         }),
      )
      .query(async ({ input }) =>
         stamp(await getArtists(input.sectionId, input.start, input.size)),
      ),

   browseMovies: paginatedBrowse(getMovies),
   browseShows: paginatedBrowse(getShows),
   browseArtists: paginatedBrowse(getArtists),

   getOnDeck: publicProcedure.query(async () => stamp(await getOnDeck())),

   getRecentlyAdded: publicProcedure
      .input(
         z.object({
            sectionId: z.string(),
            count: z.number().default(20),
         }),
      )
      .query(async ({ input }) =>
         stamp(await getRecentlyAdded(input.sectionId, input.count)),
      ),

   getGenres: publicProcedure
      .input(z.object({ sectionId: z.string() }))
      .query(async ({ input }) => stamp(await getGenres(input.sectionId))),

   getMetadata: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => stamp(await getMetadata(input.ratingKey))),

   getChildren: publicProcedure
      .input(z.object({ ratingKey: z.string() }))
      .query(async ({ input }) => stamp(await getChildren(input.ratingKey))),
});
