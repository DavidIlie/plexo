import { Suspense } from "react";

import { getLibrarySections, getShows } from "~/lib/plex";
import { ShowsBrowser } from "~/components/media/shows-browser";
import { Skeleton } from "~/components/ui/skeleton";

const GridFallback = () => (
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 18 }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

const ShowsShell = async () => {
   const sections = await getLibrarySections();
   const sectionId = sections.find((s) => s.type === "show")?.key;

   if (!sectionId) {
      return (
         <p className="text-sm text-muted-foreground">No TV library found.</p>
      );
   }

   const { items, totalSize } = await getShows(sectionId, 0, 60);

   return (
      <ShowsBrowser
         sectionId={sectionId}
         initialItems={items}
         totalSize={totalSize}
      />
   );
};

const TVPage = () => (
   <Suspense fallback={<GridFallback />}>
      <ShowsShell />
   </Suspense>
);
export default TVPage;
