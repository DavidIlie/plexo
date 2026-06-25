import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getMetadata, getChildren } from "~/lib/plex";
import { Skeleton } from "~/components/ui/skeleton";
import { ArtistDetail } from "./artist-detail";

interface ArtistPageProps {
   params: Promise<{ ratingKey: string }>;
}

export const generateMetadata = async ({
   params,
}: ArtistPageProps): Promise<Metadata> => {
   const { ratingKey } = await params;
   const artist = await getMetadata(ratingKey);
   if (!artist) return { title: "Artist Not Found" };
   const desc = artist.summary
      ? artist.summary.slice(0, 160)
      : `Browse albums and tracks by ${artist.title}`;
   const ogUrl = `/og?page=artist&artist=${ratingKey}`;
   return {
      title: artist.title,
      description: desc,
      openGraph: {
         title: artist.title,
         description: desc,
         images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", images: [ogUrl] },
   };
};

const ArtistFallback = () => (
   <div className="space-y-6">
      <Skeleton className="h-4 w-28" />
      <div className="flex flex-col gap-6 sm:flex-row">
         <Skeleton className="h-48 w-48 shrink-0 rounded-lg" />
         <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
         </div>
      </div>
   </div>
);

const ArtistContent = async ({ params }: ArtistPageProps) => {
   const { ratingKey } = await params;
   const [artist, albums] = await Promise.all([
      getMetadata(ratingKey),
      getChildren(ratingKey),
   ]);
   if (!artist) notFound();

   return <ArtistDetail artist={artist} albums={albums} />;
};

const ArtistPage = ({ params }: ArtistPageProps) => {
   return (
      <Suspense fallback={<ArtistFallback />}>
         <ArtistContent params={params} />
      </Suspense>
   );
};
export default ArtistPage;
