import { Suspense } from "react";
import { notFound } from "next/navigation";

import { env } from "~/env";
import { getLibrarySections, getArtists } from "~/lib/plex";
import { ArtistsBrowser } from "~/components/media/artists-browser";
import { Skeleton } from "~/components/ui/skeleton";

const GridFallback = () => (
   <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: 18 }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

const MusicShell = async () => {
   const sections = await getLibrarySections();
   const sectionId = sections.find((s) => s.type === "artist")?.key;

   if (!sectionId) {
      return (
         <p className="text-sm text-muted-foreground">No music library found.</p>
      );
   }

   const { items, totalSize } = await getArtists(sectionId, 0, 60);

   return (
      <ArtistsBrowser
         sectionId={sectionId}
         initialItems={items}
         totalSize={totalSize}
      />
   );
};

const MusicPage = () => {
   if (!env.SHOW_MUSIC) notFound();

   return (
      <Suspense fallback={<GridFallback />}>
         <MusicShell />
      </Suspense>
   );
};
export default MusicPage;
