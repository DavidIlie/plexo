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

const getResolutionCategory = (res: string | undefined): string => {
   if (!res) return "unknown";
   if (res === "4k" || res === "2160") return "4k";
   if (res === "1080") return "1080p";
   if (res === "720") return "720p";
   return "sd";
};

interface MoviesBrowserProps {
   sectionId: string;
   initialItems: PlexMediaItem[];
   totalSize: number;
}

// Renders the grid from plain state seeded with the server-fetched first page,
// so the initial render (and the static prerender) shows real posters in the
// shell. tRPC is used ONLY to append subsequent pages on "load more" — never as
// the render source (a useQuery/useInfiniteQuery render path does not
// materialize into the static shell, which is what kept this route "cold").
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

   const [extraItems, setExtraItems] = useState<PlexMediaItem[]>([]);
   const [cursor, setCursor] = useState<number | undefined>(
      initialItems.length < totalSize ? initialItems.length : undefined,
   );
   const [loadingMore, setLoadingMore] = useState(false);

   const movies = useMemo(
      () => [...initialItems, ...extraItems],
      [initialItems, extraItems],
   );

   const hasNextPage = cursor !== undefined;

   const loadMore = useCallback(async () => {
      if (cursor === undefined || loadingMore) return;
      setLoadingMore(true);
      try {
         const page = await queryClient.fetchQuery(
            trpc.plex.browseMovies.queryOptions({ sectionId, cursor }),
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
      for (const movie of movies) {
         if (movie.Genre) {
            for (const g of movie.Genre) genreSet.add(g.tag);
         }
      }
      return Array.from(genreSet).sort();
   }, [movies]);

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
         if (
            debouncedSearch &&
            !movie.title.toLowerCase().includes(debouncedSearch.toLowerCase())
         ) {
            return false;
         }
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
