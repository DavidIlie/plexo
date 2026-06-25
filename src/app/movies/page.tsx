import { Suspense } from "react";

import { getMovies } from "~/lib/plex";
import { LibraryShell } from "~/app/_lib/library-shell";
import { MoviesBrowser } from "~/components/media/movies-browser";
import { MediaGridFallback } from "~/components/skeletons";

const MoviesPage = () => (
   <Suspense fallback={<MediaGridFallback />}>
      <LibraryShell
         type="movie"
         emptyMessage="No movie library found."
         fetchPage={(sectionId) => getMovies(sectionId, 0, 60)}
      >
         {({ sectionId, initialItems, totalSize }) => (
            <MoviesBrowser
               sectionId={sectionId}
               initialItems={initialItems}
               totalSize={totalSize}
            />
         )}
      </LibraryShell>
   </Suspense>
);
export default MoviesPage;
