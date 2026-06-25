import { Suspense } from "react";
import { notFound } from "next/navigation";

import { env } from "~/env";
import { getArtists } from "~/lib/plex";
import { LibraryShell } from "~/app/_lib/library-shell";
import { ArtistsBrowser } from "~/components/media/artists-browser";
import { MediaGridFallback } from "~/components/skeletons";

const MusicPage = () => {
   if (!env.SHOW_MUSIC) notFound();

   return (
      <Suspense fallback={<MediaGridFallback variant="music" />}>
         <LibraryShell
            type="artist"
            emptyMessage="No music library found."
            fetchPage={(sectionId) => getArtists(sectionId, 0, 60)}
         >
            {({ sectionId, initialItems, totalSize }) => (
               <ArtistsBrowser
                  sectionId={sectionId}
                  initialItems={initialItems}
                  totalSize={totalSize}
               />
            )}
         </LibraryShell>
      </Suspense>
   );
};
export default MusicPage;
