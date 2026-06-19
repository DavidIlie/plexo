import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { env } from "~/env";
import { CACHE_TAGS } from "~/lib/cache-tags";
import type {
   TautulliResponse,
   TautulliHistoryData,
   TautulliHistoryItem,
   TautulliHomeStatItem,
   TautulliPlaysByDate,
   TautulliPlaysByDayOfWeek,
   TautulliPlaysByHourOfDay,
} from "~/types/tautulli";

const tautulliFetch = async <T>(
   cmd: string,
   params: Record<string, string | number> = {},
): Promise<T> => {
   const url = new URL("/api/v2", env.TAUTULLI_URL);
   url.searchParams.set("apikey", env.TAUTULLI_API_KEY);
   url.searchParams.set("cmd", cmd);

   if (env.TAUTULLI_USER_ID) {
      url.searchParams.set("user_id", env.TAUTULLI_USER_ID);
   }

   for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
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
   // Filter out deleted Plex entries (empty guid) and unknown airings
   if (!item.guid && item.title === "Unknown Airing") return false;
   // Filter out live TV recordings that are no longer available
   if (item.guid?.startsWith("tv.plex.xmltv://") && !item.thumb) return false;
   return true;
};

// NOT cached: this is the cursor-paginated browse reader (length/start vary per
// request), so caching would create a near-unique key per page. Aggregations
// that need a fixed window call this with fixed args inside their own cached
// scope, so the aggregate result is still cached.
export const getHistory = async (
   length = 10,
   start = 0,
   mediaType?: string,
): Promise<TautulliHistoryData> => {
   const params: Record<string, string | number> = { length, start };
   if (mediaType) params.media_type = mediaType;
   const result = await tautulliFetch<TautulliHistoryData>("get_history", params);
   const filtered = result.data.filter(isPopulatedHistoryItem);
   return {
      ...result,
      data: filtered,
      recordsFiltered: result.recordsFiltered - (result.data.length - filtered.length),
   };
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
): Promise<TautulliPlaysByDate> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysByDate);

   return tautulliFetch<TautulliPlaysByDate>("get_plays_by_date", {
      time_range: timeRange,
      y_axis: yAxis,
   });
};

export const getPlaysByDayOfWeek = async (
   timeRange = 30,
): Promise<TautulliPlaysByDayOfWeek> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysByDayOfWeek);

   return tautulliFetch<TautulliPlaysByDayOfWeek>("get_plays_by_dayofweek", {
      time_range: timeRange,
   });
};

export const getPlaysByHourOfDay = async (
   timeRange = 30,
): Promise<TautulliPlaysByHourOfDay> => {
   "use cache";
   cacheLife("analytics");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliPlaysByHourOfDay);

   return tautulliFetch<TautulliPlaysByHourOfDay>("get_plays_by_hourofday", {
      time_range: timeRange,
   });
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
