"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

// Grid renders from plain state seeded with the server-fetched first page (warm
// static shell); tRPC only appends subsequent pages on "load more".
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

   const [extraItems, setExtraItems] = useState<PlexMediaItem[]>([]);
   const [cursor, setCursor] = useState<number | undefined>(
      initialItems.length < totalSize ? initialItems.length : undefined,
   );
   const [loadingMore, setLoadingMore] = useState(false);

   const shows = useMemo(
      () => [...initialItems, ...extraItems],
      [initialItems, extraItems],
   );

   const hasNextPage = cursor !== undefined;

   const loadMore = useCallback(async () => {
      if (cursor === undefined || loadingMore) return;
      setLoadingMore(true);
      try {
         const page = await queryClient.fetchQuery(
            trpc.plex.browseShows.queryOptions({ sectionId, cursor }),
         );
         setExtraItems((prev) => [...prev, ...page.items]);
         setCursor(page.nextCursor ?? undefined);
      } finally {
         setLoadingMore(false);
      }
   }, [cursor, loadingMore, queryClient, trpc, sectionId]);

   const sentinelRef = useIntersectionObserver(
      () => void loadMore(),
      hasNextPage,
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
         {loadingMore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
               {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
               ))}
            </div>
         )}
      </div>
   );
};
