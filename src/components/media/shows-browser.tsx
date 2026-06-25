"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { usePaginatedBrowse } from "~/hooks/use-paginated-browse";
import { extractGenres, matchesSearch } from "~/lib/media-filters";
import { MediaGrid } from "~/components/media/media-grid";
import { MediaFilters } from "~/components/media/media-filters";
import { LoadMoreSkeleton } from "~/components/skeletons";
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
   const queryClient = useQueryClient();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const [completionFilter, setCompletionFilter] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const fetchPage = useCallback(
      async (cursor: number) =>
         queryClient.fetchQuery(
            trpc.plex.browseShows.queryOptions({ sectionId, cursor }),
         ),
      [queryClient, trpc, sectionId],
   );

   const { items: shows, loadingMore, sentinelRef } = usePaginatedBrowse({
      initialItems,
      totalSize,
      fetchPage,
   });

   const genres = useMemo(() => extractGenres(shows), [shows]);

   const filteredShows = useMemo(() => {
      return shows.filter((show) => {
         if (!matchesSearch(show.title, debouncedSearch)) return false;
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
         {loadingMore && <LoadMoreSkeleton />}
      </div>
   );
};
