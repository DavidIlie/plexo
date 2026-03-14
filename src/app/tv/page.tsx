"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { useDebounce } from "~/hooks/use-debounce";
import { MediaGrid } from "~/components/media/media-grid";
import { MediaFilters } from "~/components/media/media-filters";
import { Skeleton } from "~/components/ui/skeleton";

const getCompletionStatus = (
   viewedLeafCount: number | undefined,
   leafCount: number | undefined,
): string => {
   if (!viewedLeafCount || !leafCount) return "not_started";
   if (viewedLeafCount >= leafCount) return "completed";
   if (viewedLeafCount > 0) return "watching";
   return "not_started";
};

const TVPage = () => {
   const trpc = useTRPC();
   const [search, setSearch] = useState("");
   const [genre, setGenre] = useState("all");
   const [completionFilter, setCompletionFilter] = useState("all");
   const debouncedSearch = useDebounce(search, 300);

   const { data: sections } = useQuery(
      trpc.plex.getLibrarySections.queryOptions(),
   );
   const showSectionId = sections?.data.find(
      (s) => s.type === "show",
   )?.key;

   const { data: showsData, isLoading } = useQuery(
      trpc.plex.getShows.queryOptions(
         { sectionId: showSectionId ?? "2" },
      ),
   );

   const shows = showsData?.data.items ?? [];

   const genres = useMemo(() => {
      const genreSet = new Set<string>();
      for (const show of shows) {
         if (show.Genre) {
            for (const g of show.Genre) {
               genreSet.add(g.tag);
            }
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
         if (
            genre !== "all" &&
            !show.Genre?.some((g) => g.tag === genre)
         ) {
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

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-lg font-semibold">TV Shows</h1>
            {filteredShows.length !== shows.length && (
               <p className="text-sm text-muted-foreground">
                  {filteredShows.length} of {shows.length}
               </p>
            )}
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

         {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
               {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
               ))}
            </div>
         ) : (
            <MediaGrid items={filteredShows} showProgress />
         )}
      </div>
   );
};
export default TVPage;
