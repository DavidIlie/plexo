import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { env } from "~/env";
import { getArtists } from "~/lib/plex";
import { LibraryShell } from "~/app/_lib/library-shell";
import { ArtistsBrowser } from "~/components/media/artists-browser";
import { MediaGridFallback } from "~/components/skeletons";

// The SHOW_MUSIC gate must run at request time, not during the build
// prerender: the Docker image builds without deployment env, so a
// prerender-time notFound() bakes a 404 into the /music App Shell and
// every soft navigation renders it regardless of runtime env.
const MusicLibrary = async () => {
   await connection();
   if (!env.SHOW_MUSIC) notFound();

   return (
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
   );
};

const MusicPage = () => (
   <Suspense fallback={<MediaGridFallback variant="music" />}>
      <MusicLibrary />
   </Suspense>
);
export default MusicPage;
