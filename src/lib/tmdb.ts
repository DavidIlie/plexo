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

interface TmdbMovieDetail {
   id: number;
   title: string;
   release_date: string;
   poster_path: string | null;
}

interface TmdbTvDetail {
   id: number;
   name: string;
   first_air_date: string;
   poster_path: string | null;
}

export const getMediaDetail = async (
   tmdbId: number,
   mediaType: "movie" | "tv",
): Promise<{ title: string; year: string; posterPath: string | null } | null> => {
   if (!env.TMDB_API_KEY) return null;

   const endpoint = mediaType === "movie" ? "movie" : "tv";
   const url = new URL(`${TMDB_BASE}/${endpoint}/${tmdbId}`);
   url.searchParams.set("api_key", env.TMDB_API_KEY);
   url.searchParams.set("language", "en-US");

   const res = await fetch(url.toString());
   if (!res.ok) return null;

   if (mediaType === "movie") {
      const data = (await res.json()) as TmdbMovieDetail;
      return {
         title: data.title,
         year: data.release_date?.slice(0, 4) ?? "",
         posterPath: data.poster_path,
      };
   }

   const data = (await res.json()) as TmdbTvDetail;
   return {
      title: data.name,
      year: data.first_air_date?.slice(0, 4) ?? "",
      posterPath: data.poster_path,
   };
};
