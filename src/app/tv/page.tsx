import { Suspense } from "react";

import { getShows } from "~/lib/plex";
import { LibraryShell } from "~/app/_lib/library-shell";
import { ShowsBrowser } from "~/components/media/shows-browser";
import { MediaGridFallback } from "~/components/skeletons";

const TVPage = () => (
   <Suspense fallback={<MediaGridFallback />}>
      <LibraryShell
         type="show"
         emptyMessage="No TV library found."
         fetchPage={(sectionId) => getShows(sectionId, 0, 60)}
      >
         {({ sectionId, initialItems, totalSize }) => (
            <ShowsBrowser
               sectionId={sectionId}
               initialItems={initialItems}
               totalSize={totalSize}
            />
         )}
      </LibraryShell>
   </Suspense>
);
export default TVPage;
