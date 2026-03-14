"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { RefreshButton } from "~/components/refresh-button";
import { useDebounce } from "~/hooks/use-debounce";
import { MediaCard } from "~/components/media/media-card";
import { MediaFilters } from "~/components/media/media-filters";
import { Skeleton } from "~/components/ui/skeleton";

const MusicPage = () => {
   const trpc = useTRPC();
   const router = useRouter();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const { data: sections } = useQuery(
      trpc.plex.getLibrarySections.queryOptions(),
   );
   const musicSectionId = sections?.data.find(
      (s) => s.type === "artist",
   )?.key;

   const { data: artistsData, isLoading } = useQuery(
      trpc.plex.getArtists.queryOptions(
         { sectionId: musicSectionId ?? "1" },
      ),
   );

   const artists = (artistsData?.data.items ?? []).filter(
      (a) => a.thumb,
   );

   const genres = useMemo(() => {
      const genreSet = new Set<string>();
      for (const artist of artists) {
         if (artist.Genre) {
            for (const g of artist.Genre) {
               genreSet.add(g.tag);
            }
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
         if (
            genre !== "all" &&
            !artist.Genre?.some((g) => g.tag === genre)
         ) {
            return false;
         }
         return true;
      });
   }, [artists, debouncedSearch, genre]);

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-lg font-semibold">Music</h1>
               {filteredArtists.length !== artists.length && (
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

         {isLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
               {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
               ))}
            </div>
         ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
               {filteredArtists.map((artist) => (
                  <MediaCard
                     key={artist.ratingKey}
                     item={artist}
                     onClick={() => router.push(`/music/${artist.ratingKey}`)}
                  />
               ))}
            </div>
         )}
      </div>
   );
};
export default MusicPage;
