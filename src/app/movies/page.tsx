"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { MediaGrid } from "~/components/media/media-grid";
import { MediaFilters } from "~/components/media/media-filters";
import { Skeleton } from "~/components/ui/skeleton";

const MoviesPage = () => {
   const trpc = useTRPC();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const [watchStatus, setWatchStatus] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const { data: sections } = useQuery(
      trpc.plex.getLibrarySections.queryOptions(),
   );
   const movieSectionId = sections?.data.find(
      (s) => s.type === "movie",
   )?.key;

   const {
      data: moviesData,
      isLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
   } = useInfiniteQuery(
      trpc.plex.browseMovies.infiniteQueryOptions(
         { sectionId: movieSectionId ?? "1" },
         {
            initialCursor: 0,
            getNextPageParam: (lastPage) => lastPage.nextCursor,
         },
      ),
   );

   const movies = useMemo(
      () => moviesData?.pages.flatMap((p) => p.items) ?? [],
      [moviesData],
   );

   const totalSize = moviesData?.pages[0]?.totalSize ?? 0;

   const genres = useMemo(() => {
      const genreSet = new Set<string>();
      for (const movie of movies) {
         if (movie.Genre) {
            for (const g of movie.Genre) {
               genreSet.add(g.tag);
            }
         }
      }
      return Array.from(genreSet).sort();
   }, [movies]);

   const filteredMovies = useMemo(() => {
      return movies.filter((movie) => {
         if (
            debouncedSearch &&
            !movie.title.toLowerCase().includes(debouncedSearch.toLowerCase())
         ) {
            return false;
         }
         if (
            genre !== "all" &&
            !movie.Genre?.some((g) => g.tag === genre)
         ) {
            return false;
         }
         if (watchStatus === "watched" && !(movie.viewCount && movie.viewCount > 0)) {
            return false;
         }
         if (watchStatus === "unwatched" && movie.viewCount && movie.viewCount > 0) {
            return false;
         }
         return true;
      });
   }, [movies, debouncedSearch, genre, watchStatus]);

   const loadMore = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
         void fetchNextPage();
      }
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage);

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">Movies</h1>
               {(debouncedSearch || genre !== "all" || watchStatus !== "all") &&
                  filteredMovies.length !== movies.length && (
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
         />

         {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
               {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
               ))}
            </div>
         ) : (
            <>
               <MediaGrid items={filteredMovies} />
               <div ref={sentinelRef} className="h-1" />
               {isFetchingNextPage && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                     {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
                     ))}
                  </div>
               )}
            </>
         )}
      </div>
   );
};
export default MoviesPage;
