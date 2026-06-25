"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { usePaginatedBrowse } from "~/hooks/use-paginated-browse";
import { extractGenres, matchesSearch } from "~/lib/media-filters";
import { getResolutionCategory } from "~/lib/media-quality";
import { MediaGrid } from "~/components/media/media-grid";
import { MediaFilters } from "~/components/media/media-filters";
import { LoadMoreSkeleton } from "~/components/skeletons";
import type { PlexMediaItem } from "~/types/plex";

interface MoviesBrowserProps {
   sectionId: string;
   initialItems: PlexMediaItem[];
   totalSize: number;
}

export const MoviesBrowser = ({
   sectionId,
   initialItems,
   totalSize,
}: MoviesBrowserProps) => {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const [watchStatus, setWatchStatus] = useState("all");
   const [quality, setQuality] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const fetchPage = useCallback(
      async (cursor: number) =>
         queryClient.fetchQuery(
            trpc.plex.browseMovies.queryOptions({ sectionId, cursor }),
         ),
      [queryClient, trpc, sectionId],
   );

   const { items: movies, loadingMore, sentinelRef } = usePaginatedBrowse({
      initialItems,
      totalSize,
      fetchPage,
   });

   const genres = useMemo(() => extractGenres(movies), [movies]);

   const qualityOptions = useMemo(() => {
      const cats = new Set<string>();
      for (const movie of movies) {
         const res = movie.Media?.[0]?.videoResolution;
         if (res) cats.add(getResolutionCategory(res));
      }
      const opts: Array<{ value: string; label: string }> = [
         { value: "all", label: "All Quality" },
      ];
      if (cats.has("4k")) opts.push({ value: "4k", label: "4K" });
      if (cats.has("1080p")) opts.push({ value: "1080p", label: "1080p" });
      if (cats.has("720p")) opts.push({ value: "720p", label: "720p" });
      if (cats.has("sd")) opts.push({ value: "sd", label: "SD" });
      return opts.length > 1 ? opts : undefined;
   }, [movies]);

   const filteredMovies = useMemo(() => {
      return movies.filter((movie) => {
         if (!matchesSearch(movie.title, debouncedSearch)) return false;
         if (genre !== "all" && !movie.Genre?.some((g) => g.tag === genre)) {
            return false;
         }
         if (
            watchStatus === "watched" &&
            !(movie.viewCount && movie.viewCount > 0)
         ) {
            return false;
         }
         if (
            watchStatus === "unwatched" &&
            movie.viewCount &&
            movie.viewCount > 0
         ) {
            return false;
         }
         if (quality !== "all") {
            const cat = getResolutionCategory(movie.Media?.[0]?.videoResolution);
            if (cat !== quality) return false;
         }
         return true;
      });
   }, [movies, debouncedSearch, genre, watchStatus, quality]);

   const hasFilters =
      !!debouncedSearch ||
      genre !== "all" ||
      watchStatus !== "all" ||
      quality !== "all";

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">Movies</h1>
               {hasFilters && filteredMovies.length !== movies.length && (
                  <p className="text-sm text-muted-foreground">
                     {filteredMovies.length} of {movies.length}
                  </p>
               )}
            </div>
            <RefreshButton />
         </div>

         <MediaFilters
            search={search}
            onSearchChange={setSearch}
            genre={genre}
            onGenreChange={setGenre}
            genres={genres}
            statusFilter={watchStatus}
            onStatusFilterChange={setWatchStatus}
            statusOptions={[
               { value: "all", label: "All" },
               { value: "watched", label: "Watched" },
               { value: "unwatched", label: "Unwatched" },
            ]}
            qualityFilter={quality}
            onQualityFilterChange={setQuality}
            qualityOptions={qualityOptions}
         />

         <MediaGrid items={filteredMovies} />
         <div ref={sentinelRef} className="h-1" />
         {loadingMore && <LoadMoreSkeleton />}
      </div>
   );
};
