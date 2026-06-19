"use client";

import { useState, useMemo, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { MediaGrid } from "~/components/media/media-grid";
import { MediaFilters } from "~/components/media/media-filters";
import { Skeleton } from "~/components/ui/skeleton";
import type { PlexMediaItem } from "~/types/plex";

const getCompletionStatus = (
   viewedLeafCount: number | undefined,
   leafCount: number | undefined,
): string => {
   if (!viewedLeafCount || !leafCount) return "not_started";
   if (viewedLeafCount >= leafCount) return "completed";
   if (viewedLeafCount > 0) return "watching";
   return "not_started";
};

interface ShowsBrowserProps {
   sectionId: string;
   initialItems: PlexMediaItem[];
   totalSize: number;
}

export const ShowsBrowser = ({
   sectionId,
   initialItems,
   totalSize,
}: ShowsBrowserProps) => {
   const trpc = useTRPC();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const [completionFilter, setCompletionFilter] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const pageSize = initialItems.length || 60;
   const firstNextCursor = pageSize < totalSize ? pageSize : undefined;

   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
      useInfiniteQuery({
         ...trpc.plex.browseShows.infiniteQueryOptions(
            { sectionId },
            {
               initialCursor: 0,
               getNextPageParam: (lastPage) => lastPage.nextCursor,
            },
         ),
         initialData: {
            pages: [
               { items: initialItems, totalSize, nextCursor: firstNextCursor },
            ],
            pageParams: [0],
         },
         refetchInterval: 30 * 60 * 1000,
      });

   const shows = useMemo(
      () => data?.pages.flatMap((p) => p.items) ?? initialItems,
      [data, initialItems],
   );

   const genres = useMemo(() => {
      const genreSet = new Set<string>();
      for (const show of shows) {
         if (show.Genre) {
            for (const g of show.Genre) genreSet.add(g.tag);
         }
      }
      return Array.from(genreSet).sort();
   }, [shows]);

   const filteredShows = useMemo(() => {
      return shows.filter((show) => {
         if (
            debouncedSearch &&
            !show.title.toLowerCase().includes(debouncedSearch.toLowerCase())
         ) {
            return false;
         }
         if (genre !== "all" && !show.Genre?.some((g) => g.tag === genre)) {
            return false;
         }
         if (completionFilter !== "all") {
            const status = getCompletionStatus(
               show.viewedLeafCount,
               show.leafCount,
            );
            if (status !== completionFilter) return false;
         }
         return true;
      });
   }, [shows, debouncedSearch, genre, completionFilter]);

   const loadMore = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
         void fetchNextPage();
      }
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage);

   const hasFilters =
      !!debouncedSearch || genre !== "all" || completionFilter !== "all";

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">TV Shows</h1>
               {hasFilters && filteredShows.length !== shows.length && (
                  <p className="text-sm text-muted-foreground">
                     {filteredShows.length} of {shows.length}
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
            statusFilter={completionFilter}
            onStatusFilterChange={setCompletionFilter}
            statusOptions={[
               { value: "all", label: "All" },
               { value: "watching", label: "Watching" },
               { value: "completed", label: "Completed" },
               { value: "not_started", label: "Not Started" },
            ]}
         />

         <MediaGrid items={filteredShows} showProgress />
         <div ref={sentinelRef} className="h-1" />
         {isFetchingNextPage && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
               {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
               ))}
            </div>
         )}
      </div>
   );
};
