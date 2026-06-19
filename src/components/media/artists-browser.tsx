"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { useIntersectionObserver } from "~/hooks/use-intersection-observer";
import { MediaCard } from "~/components/media/media-card";
import { MediaFilters } from "~/components/media/media-filters";
import { Skeleton } from "~/components/ui/skeleton";
import type { PlexMediaItem } from "~/types/plex";

interface ArtistsBrowserProps {
   sectionId: string;
   initialItems: PlexMediaItem[];
   totalSize: number;
}

export const ArtistsBrowser = ({
   sectionId,
   initialItems,
   totalSize,
}: ArtistsBrowserProps) => {
   const trpc = useTRPC();
   const router = useRouter();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const pageSize = initialItems.length || 60;
   const firstNextCursor = pageSize < totalSize ? pageSize : undefined;

   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
      useInfiniteQuery({
         ...trpc.plex.browseArtists.infiniteQueryOptions(
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

   const artists = useMemo(
      () =>
         (data?.pages.flatMap((p) => p.items) ?? initialItems).filter(
            (a) => a.thumb,
         ),
      [data, initialItems],
   );

   const genres = useMemo(() => {
      const genreSet = new Set<string>();
      for (const artist of artists) {
         if (artist.Genre) {
            for (const g of artist.Genre) genreSet.add(g.tag);
         }
      }
      return Array.from(genreSet).sort();
   }, [artists]);

   const filteredArtists = useMemo(() => {
      return artists.filter((artist) => {
         if (
            debouncedSearch &&
            !artist.title.toLowerCase().includes(debouncedSearch.toLowerCase())
         ) {
            return false;
         }
         if (genre !== "all" && !artist.Genre?.some((g) => g.tag === genre)) {
            return false;
         }
         return true;
      });
   }, [artists, debouncedSearch, genre]);

   const loadMore = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage) {
         void fetchNextPage();
      }
   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage);

   const hasFilters = !!debouncedSearch || genre !== "all";

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">Music</h1>
               {hasFilters && filteredArtists.length !== artists.length && (
                  <p className="text-sm text-muted-foreground">
                     {filteredArtists.length} of {artists.length}
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
         />

         <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {filteredArtists.map((artist) => (
               <MediaCard
                  key={artist.ratingKey}
                  item={artist}
                  onClick={() => router.push(`/music/${artist.ratingKey}`)}
               />
            ))}
         </div>
         <div ref={sentinelRef} className="h-1" />
         {isFetchingNextPage && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
               {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
               ))}
            </div>
         )}
      </div>
   );
};
