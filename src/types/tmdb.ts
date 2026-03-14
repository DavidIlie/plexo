export interface TmdbSearchResult {
   id: number;
   media_type: "movie" | "tv";
   title?: string;
   name?: string;
   release_date?: string;
   first_air_date?: string;
   poster_path: string | null;
   overview: string;
}

export interface TmdbSearchResultWithLibrary extends TmdbSearchResult {
   inLibrary: boolean;
}

export interface TmdbSearchResponse {
   page: number;
   results: TmdbSearchResult[];
   total_results: number;
   total_pages: number;
}
