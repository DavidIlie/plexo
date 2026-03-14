"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { useDebounce } from "~/hooks/use-debounce";
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

   const { data: moviesData, isLoading } = useQuery(
      trpc.plex.getMovies.queryOptions(
         { sectionId: movieSectionId ?? "1" },
      ),
   );

   const movies = moviesData?.data.items ?? [];

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

   return (
      <div className="space-y-6">
         <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
               <Film className="h-7 w-7 text-primary" />
               My Movies
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
               {filteredMovies.length} of {movies.length} movies
            </p>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
               {Array.from({ length: 18 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
               ))}
            </div>
         ) : (
            <MediaGrid items={filteredMovies} />
         )}
      </div>
   );
};
export default MoviesPage;
