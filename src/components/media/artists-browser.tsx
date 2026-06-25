"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { usePaginatedBrowse } from "~/hooks/use-paginated-browse";
import { extractGenres, matchesSearch } from "~/lib/media-filters";
import { MediaCard } from "~/components/media/media-card";
import { MediaFilters } from "~/components/media/media-filters";
import { LoadMoreSkeleton } from "~/components/skeletons";
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
   const queryClient = useQueryClient();
   const router = useRouter();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const fetchPage = useCallback(
      async (cursor: number) =>
         queryClient.fetchQuery(
            trpc.plex.browseArtists.queryOptions({ sectionId, cursor }),
         ),
      [queryClient, trpc, sectionId],
   );

   const { items: rawArtists, loadingMore, sentinelRef } = usePaginatedBrowse({
      initialItems,
      totalSize,
      fetchPage,
   });

   const artists = useMemo(
      () => rawArtists.filter((a) => a.thumb),
      [rawArtists],
   );

   const genres = useMemo(() => extractGenres(artists), [artists]);

   const filteredArtists = useMemo(() => {
      return artists.filter((artist) => {
         if (!matchesSearch(artist.title, debouncedSearch)) return false;
         if (genre !== "all" && !artist.Genre?.some((g) => g.tag === genre)) {
            return false;
         }
         return true;
      });
   }, [artists, debouncedSearch, genre]);

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
         {loadingMore && <LoadMoreSkeleton variant="music" />}
      </div>
   );
};
