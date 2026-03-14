import "server-only";

import { env } from "~/env";
import type { TmdbSearchResult, TmdbSearchResponse } from "~/types/tmdb";

const TMDB_BASE = "https://api.themoviedb.org/3";

export const searchMedia = async (
   query: string,
): Promise<TmdbSearchResult[]> => {
   if (!env.TMDB_API_KEY) return [];

   const url = new URL(`${TMDB_BASE}/search/multi`);
   url.searchParams.set("api_key", env.TMDB_API_KEY);
   url.searchParams.set("query", query);
   url.searchParams.set("include_adult", "false");
   url.searchParams.set("language", "en-US");
   url.searchParams.set("page", "1");

   const res = await fetch(url.toString());
   if (!res.ok) return [];

   const data = (await res.json()) as TmdbSearchResponse;

   return data.results
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 10);
};
