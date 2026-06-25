import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { verifyTurnstile } from "~/lib/turnstile";
import { sendRecommendation, sendTestNotification } from "~/lib/notify";
import { checkRateLimit, resetRateLimitKey } from "~/lib/rate-limit";
import { createRequest as createOverseerrRequest } from "~/lib/overseerr";
import {
   getLibraryTitlesCached,
   searchTmdbCached,
   getWishlistCached,
} from "~/server/cache/recommend";
import { env } from "~/env";

const HOUR_MS = 60 * 60 * 1000;

import { normalizeTitle } from "~/lib/media-match";

const getLibraryTitles = async (): Promise<Set<string>> => {
   return new Set(await getLibraryTitlesCached());
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

         const [searchData, libraryTitles] = await Promise.all([
            searchTmdbCached(input.query.toLowerCase().trim()),
            getLibraryTitles(),
         ]);

         const results = searchData.map((item) => {
            const title = item.title ?? item.name ?? "";
            const year =
               (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? "";
            const inLibrary = libraryTitles.has(
               `${normalizeTitle(title)}|${year}`,
            );
            return { ...item, inLibrary };
         });

         return { data: results, lastUpdatedAt: new Date().toISOString() };
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

         if (env.TURNSTILE_SECRET_KEY) {
            if (!input.turnstileToken) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Captcha verification required",
               });
            }
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

         if (
            env.RECOMMEND_AUTO_REQUEST &&
            env.OVERSEERR_URL &&
            env.OVERSEERR_API_KEY
         ) {
            try {
               await createOverseerrRequest(input.tmdbId, input.mediaType);
            } catch {}
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
      const data = await getWishlistCached();
      return { data, lastUpdatedAt: new Date().toISOString() };
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
