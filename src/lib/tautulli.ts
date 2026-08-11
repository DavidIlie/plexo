import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { env } from "~/env";
import { CACHE_TAGS } from "~/lib/cache-tags";
import type {
   TautulliResponse,
   TautulliHistoryData,
   TautulliHistoryItem,
   TautulliActivityData,
   TautulliHomeStatItem,
   TautulliPlaysByDate,
   TautulliPlaysByDayOfWeek,
   TautulliPlaysByHourOfDay,
   TautulliUser,
} from "~/types/tautulli";

const tautulliFetch = async <T>(
   cmd: string,
   params: Record<string, string | number> = {},
): Promise<T> => {
   const url = new URL("/api/v2", env.TAUTULLI_URL);
   url.searchParams.set("apikey", env.TAUTULLI_API_KEY);
   url.searchParams.set("cmd", cmd);

   for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
   }

   // The deployment-level scope always wins. Callers may narrow an
   // all-viewers deployment, but must never be able to escape this boundary.
   if (env.TAUTULLI_USER_ID) {
      url.searchParams.set("user_id", env.TAUTULLI_USER_ID);
   }

   const response = await fetch(url.toString());

   if (!response.ok) {
      throw new Error(
         `Tautulli API error: ${response.status} ${response.statusText}`,
      );
   }

   const json = (await response.json()) as TautulliResponse<T>;
   return json.response.data;
};

const isPopulatedHistoryItem = (item: TautulliHistoryItem): boolean => {
   if (!item.guid && item.title === "Unknown Airing") return false;
   if (item.guid?.startsWith("tv.plex.xmltv://") && !item.thumb) return false;
   return true;
};

/** Current Plex sessions are intentionally uncached so dashboard polling is live. */
export const getActivity = async (): Promise<TautulliActivityData> =>
   tautulliFetch<TautulliActivityData>("get_activity");

export const getHistory = async (
   length = 10,
   start = 0,
   mediaType?: string,
   userId?: string,
): Promise<TautulliHistoryData> => {
   const params: Record<string, string | number> = { length, start };
   if (mediaType) params.media_type = mediaType;
   if (userId) params.user_id = userId;
   const result = await tautulliFetch<TautulliHistoryData>("get_history", params);
   const filtered = result.data.filter(isPopulatedHistoryItem);
   return {
      ...result,
      data: filtered,
      recordsFiltered: result.recordsFiltered - (result.data.length - filtered.length),
   };
};

const HISTORY_PAGE_SIZE = 1000;

export const getHistoryRange = async (
   after: string,
   before: string,
   userId?: string,
): Promise<TautulliHistoryItem[]> => {
   const items: TautulliHistoryItem[] = [];
   let start = 0;
   let total = 0;

   do {
      const params: Record<string, string | number> = {
         after,
         before,
         grouping: 1,
         length: HISTORY_PAGE_SIZE,
         start,
      };
      if (userId) params.user_id = userId;

      const result = await tautulliFetch<TautulliHistoryData>(
         "get_history",
         params,
      );
      items.push(...result.data.filter(isPopulatedHistoryItem));
      total = result.recordsFiltered;
      start += HISTORY_PAGE_SIZE;

      if (result.data.length === 0) break;
   } while (start < total);

   return items;
};

const ITEM_HISTORY_PAGE_SIZE = 500;

const fetchHistoryPages = async (
   filter: Record<string, string | number>,
): Promise<TautulliHistoryItem[]> => {
   const items: TautulliHistoryItem[] = [];
   let start = 0;

   while (true) {
      const result = await tautulliFetch<TautulliHistoryData>("get_history", {
         ...filter,
         // Match Tautulli's user-facing history: one logical play may contain
         // several raw session rows after a resume or transcode change.
         grouping: 1,
         include_activity: 0,
         order_column: "date",
         order_dir: "desc",
         length: ITEM_HISTORY_PAGE_SIZE,
         start,
      });

      items.push(...result.data.filter(isPopulatedHistoryItem));

      if (result.data.length < ITEM_HISTORY_PAGE_SIZE) break;
      start += ITEM_HISTORY_PAGE_SIZE;
      if (start >= result.recordsFiltered) break;
   }

   return items;
};

/**
 * Fetch every history row associated with one Plex item. Movies live in the
 * row's rating key, seasons in the parent key, and TV shows in the
 * grandparent key. Querying all three keeps this generic and avoids the old
 * fixed-window scan, which could miss older or frequently watched titles.
 */
export const getItemHistoryEntries = async (
   ratingKey: string,
): Promise<TautulliHistoryItem[]> => {
   const pages = await Promise.all([
      fetchHistoryPages({ rating_key: ratingKey }),
      fetchHistoryPages({ parent_rating_key: ratingKey }),
      fetchHistoryPages({ grandparent_rating_key: ratingKey }),
   ]);

   const byRow = new Map<number, TautulliHistoryItem>();
   for (const item of pages.flat()) byRow.set(item.row_id, item);

   return [...byRow.values()].sort((a, b) => b.date - a.date);
};

export const getUsers = async (): Promise<TautulliUser[]> => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliUsers);

   return tautulliFetch<TautulliUser[]>("get_users");
};

export const getHomeStats = async (): Promise<TautulliHomeStatItem[]> => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliHomeStats);

   return tautulliFetch<TautulliHomeStatItem[]>("get_home_stats");
};

export const getPlaysByDate = async (
   timeRange = 30,
   yAxis = "plays",
   userId?: string,
): Promise<TautulliPlaysByDate> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysByDate);

   const params: Record<string, string | number> = {
      time_range: timeRange,
      y_axis: yAxis,
   };
   if (userId) params.user_id = userId;

   return tautulliFetch<TautulliPlaysByDate>("get_plays_by_date", params);
};

export const getPlaysPerMonth = async (
   timeRange = 12,
   yAxis = "plays",
   userId?: string,
): Promise<TautulliPlaysByDate> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysPerMonth);

   const params: Record<string, string | number> = {
      time_range: timeRange,
      y_axis: yAxis,
   };
   if (userId) params.user_id = userId;

   const data = await tautulliFetch<TautulliPlaysByDate>(
      "get_plays_per_month",
      params,
   );
   const firstActiveMonth = data.categories.findIndex((_, index) =>
      data.series.some((series) => (series.data[index] ?? 0) > 0),
   );
   const start = firstActiveMonth === -1
      ? Math.max(data.categories.length - 1, 0)
      : firstActiveMonth;

   return {
      categories: data.categories.slice(start),
      series: data.series.map((series) => ({
         ...series,
         data: series.data.slice(start),
      })),
   };
};

export const getPlaysByDayOfWeek = async (
   timeRange = 30,
   userId?: string,
): Promise<TautulliPlaysByDayOfWeek> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysByDayOfWeek);

   const params: Record<string, string | number> = {
      time_range: timeRange,
   };
   if (userId) params.user_id = userId;

   return tautulliFetch<TautulliPlaysByDayOfWeek>(
      "get_plays_by_dayofweek",
      params,
   );
};

export const getPlaysByHourOfDay = async (
   timeRange = 30,
   userId?: string,
): Promise<TautulliPlaysByHourOfDay> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysByHourOfDay);

   const params: Record<string, string | number> = {
      time_range: timeRange,
   };
   if (userId) params.user_id = userId;

   return tautulliFetch<TautulliPlaysByHourOfDay>(
      "get_plays_by_hourofday",
      params,
   );
};

export const getMostWatched = async (
   mediaType = "movie",
   timeRange = 30,
   limit = 10,
): Promise<TautulliHomeStatItem[]> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliMostWatched);

   return tautulliFetch<TautulliHomeStatItem[]>("get_most_watched", {
      section_type: mediaType,
      time_range: timeRange,
      stats_count: limit,
   });
};

export interface TautulliGeoData {
   code: string;
   country: string;
   region: string;
   city: string;
   postal_code: string;
   timezone: string;
   latitude: number;
   longitude: number;
   accuracy: number;
}

export interface TautulliLibraryMediaItem {
   video_resolution: string;
   video_codec: string;
   audio_codec: string;
   audio_channels: string;
   file_size: string;
   bitrate: string;
   container: string;
   title: string;
}

export interface TautulliLibraryMediaInfo {
   recordsTotal: number;
   recordsFiltered: number;
   total_file_size: number;
   filtered_file_size: number;
   data: TautulliLibraryMediaItem[];
}

export const getLibraryMediaInfo = async (
   sectionId: string,
   length = 0,
): Promise<TautulliLibraryMediaInfo> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.section(sectionId));

   return tautulliFetch<TautulliLibraryMediaInfo>("get_library_media_info", {
      section_id: sectionId,
      length,
   });
};

export const getGeoipLookup = async (
   ipAddress: string,
): Promise<TautulliGeoData> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.geo, CACHE_TAGS.geoIp(ipAddress));

   return tautulliFetch<TautulliGeoData>("get_geoip_lookup", {
      ip_address: ipAddress,
   });
};
