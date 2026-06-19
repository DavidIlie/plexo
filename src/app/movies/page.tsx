import { Suspense } from "react";

import { getLibrarySections, getMovies } from "~/lib/plex";
import { MoviesBrowser } from "~/components/media/movies-browser";
import { Skeleton } from "~/components/ui/skeleton";

const GridFallback = () => (
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 18 }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

const MoviesShell = async () => {
   const sections = await getLibrarySections();
   const sectionId = sections.find((s) => s.type === "movie")?.key;

   if (!sectionId) {
      return (
         <p className="text-sm text-muted-foreground">No movie library found.</p>
      );
   }

   const { items, totalSize } = await getMovies(sectionId, 0, 60);

   return (
      <MoviesBrowser
         sectionId={sectionId}
         initialItems={items}
         totalSize={totalSize}
      />
   );
};

const MoviesPage = () => (
   <Suspense fallback={<GridFallback />}>
      <MoviesShell />
   </Suspense>
);
export default MoviesPage;
