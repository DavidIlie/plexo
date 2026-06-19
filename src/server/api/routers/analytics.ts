import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getDashboardStatsCached } from "~/server/cache/stats";
import {
   getGenreDistributionCached,
   getTopWatchedGenresCached,
   getMediaTypeRatioCached,
   getHighlightsCached,
   getDeviceStatsCached,
   getVideoQualityStatsCached,
   getAudioFormatStatsCached,
   getMusicAudioFormatStatsCached,
   getMusicGenreDistributionCached,
   getTopArtistsCached,
   getLibrarySizeStatsCached,
   getLocationStatsCached,
} from "~/server/cache/analytics";
import {
   getPlaysByDate,
   getPlaysByDayOfWeek,
   getPlaysByHourOfDay,
} from "~/lib/tautulli";
import { env } from "~/env";

const now = () => new Date().toISOString();

export const analyticsRouter = createTRPCRouter({
   getDashboardStats: publicProcedure.query(async () => {
      const data = await getDashboardStatsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getGenreDistribution: publicProcedure.query(async () => {
      const data = await getGenreDistributionCached();
      return { data, lastUpdatedAt: now() };
   }),

   getTopWatchedGenres: publicProcedure.query(async () => {
      const data = await getTopWatchedGenresCached();
      return { data, lastUpdatedAt: now() };
   }),

   getWatchTimeByDay: publicProcedure.query(async () => {
      const data = await getPlaysByDayOfWeek(30);
      return { data, lastUpdatedAt: now() };
   }),

   getWatchTimeByHour: publicProcedure.query(async () => {
      const data = await getPlaysByHourOfDay(30);
      return { data, lastUpdatedAt: now() };
   }),

   getMonthlyTrends: publicProcedure.query(async () => {
      const data = await getPlaysByDate(365);
      return { data, lastUpdatedAt: now() };
   }),

   getMediaTypeRatio: publicProcedure.query(async () => {
      const data = await getMediaTypeRatioCached();
      return { data, lastUpdatedAt: now() };
   }),

   getHighlights: publicProcedure.query(async () => {
      const data = await getHighlightsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getDeviceStats: publicProcedure.query(async () => {
      if (!env.SHOW_DEVICES) {
         return { data: null, lastUpdatedAt: now() };
      }
      const data = await getDeviceStatsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getVideoQualityStats: publicProcedure.query(async () => {
      const data = await getVideoQualityStatsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getAudioFormatStats: publicProcedure.query(async () => {
      const data = await getAudioFormatStatsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getMusicAudioFormatStats: publicProcedure.query(async () => {
      if (!env.SHOW_MUSIC) {
         return { data: null, lastUpdatedAt: now() };
      }
      const data = await getMusicAudioFormatStatsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getMusicGenreDistribution: publicProcedure.query(async () => {
      if (!env.SHOW_MUSIC) {
         return { data: null, lastUpdatedAt: now() };
      }
      const data = await getMusicGenreDistributionCached();
      return { data, lastUpdatedAt: now() };
   }),

   getTopArtists: publicProcedure.query(async () => {
      if (!env.SHOW_MUSIC) {
         return { data: null, lastUpdatedAt: now() };
      }
      const data = await getTopArtistsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getLibrarySizeStats: publicProcedure.query(async () => {
      const data = await getLibrarySizeStatsCached();
      return { data, lastUpdatedAt: now() };
   }),

   getLocationStats: publicProcedure.query(async () => {
      if (!env.SHOW_LOCATIONS) {
         return { data: null, lastUpdatedAt: now() };
      }
      const data = await getLocationStatsCached();
      return { data, lastUpdatedAt: now() };
   }),
});
