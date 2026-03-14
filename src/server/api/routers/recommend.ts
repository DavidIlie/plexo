import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCachedOrFetch, CacheTTL } from "~/lib/cache";
import { searchMedia } from "~/lib/tmdb";
import { verifyTurnstile } from "~/lib/turnstile";
import { sendRecommendation } from "~/lib/notify";
import { checkRateLimit, resetRateLimitKey } from "~/lib/rate-limit";
import { env } from "~/env";

const HOUR_MS = 60 * 60 * 1000;

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

         const result = await getCachedOrFetch(
            `tmdb:search:${input.query.toLowerCase().trim()}`,
            () => searchMedia(input.query),
            CacheTTL.ACTIVITY,
         );

         return { data: result.data, lastUpdatedAt: result.fetchedAt.toISOString() };
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
            title: input.title,
            mediaType: input.mediaType,
            year: input.year,
            posterPath: input.posterPath,
            senderName: input.senderName,
            message: input.message,
         });

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
});
