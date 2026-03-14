import "server-only";

import { env } from "~/env";
import type {
   TautulliResponse,
   TautulliHistoryData,
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

export const getHistory = async (
   length = 10,
   start = 0,
   mediaType?: string,
): Promise<TautulliHistoryData> => {
   const params: Record<string, string | number> = { length, start };
   if (mediaType) params.media_type = mediaType;
   return tautulliFetch<TautulliHistoryData>("get_history", params);
};

export const getHomeStats = async (): Promise<TautulliHomeStatItem[]> => {
   return tautulliFetch<TautulliHomeStatItem[]>("get_home_stats");
};

export const getPlaysByDate = async (
   timeRange = 30,
   yAxis = "plays",
): Promise<TautulliPlaysByDate> => {
   return tautulliFetch<TautulliPlaysByDate>("get_plays_by_date", {
      time_range: timeRange,
      y_axis: yAxis,
   });
};

export const getPlaysByDayOfWeek = async (
   timeRange = 30,
): Promise<TautulliPlaysByDayOfWeek> => {
   return tautulliFetch<TautulliPlaysByDayOfWeek>("get_plays_by_dayofweek", {
      time_range: timeRange,
   });
};

export const getPlaysByHourOfDay = async (
   timeRange = 30,
): Promise<TautulliPlaysByHourOfDay> => {
   return tautulliFetch<TautulliPlaysByHourOfDay>("get_plays_by_hourofday", {
      time_range: timeRange,
   });
};

export const getMostWatched = async (
   mediaType = "movie",
   timeRange = 30,
   limit = 10,
): Promise<TautulliHomeStatItem[]> => {
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

export interface TautulliLibraryMediaInfo {
   recordsTotal: number;
   recordsFiltered: number;
   total_file_size: number;
   filtered_file_size: number;
   data: unknown[];
}

export const getLibraryMediaInfo = async (
   sectionId: string,
): Promise<TautulliLibraryMediaInfo> => {
   return tautulliFetch<TautulliLibraryMediaInfo>("get_library_media_info", {
      section_id: sectionId,
      length: 0,
   });
};

export const getGeoipLookup = async (
   ipAddress: string,
): Promise<TautulliGeoData> => {
   return tautulliFetch<TautulliGeoData>("get_geoip_lookup", {
      ip_address: ipAddress,
   });
};
