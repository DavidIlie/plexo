import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { caller } from "~/trpc/server";
import { Skeleton } from "~/components/ui/skeleton";
import { ArtistDetail } from "./artist-detail";

interface ArtistPageProps {
   params: Promise<{ ratingKey: string }>;
}

export const generateMetadata = async ({
   params,
}: ArtistPageProps): Promise<Metadata> => {
   const { ratingKey } = await params;
   const { data: artist } = await caller.plex.getMetadata({ ratingKey });
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

const ArtistPage = async ({ params }: ArtistPageProps) => {
   const { ratingKey } = await params;
   const { data: artist } = await caller.plex.getMetadata({ ratingKey });
   if (!artist) notFound();

   return (
      <Suspense
         fallback={
            <div className="space-y-6">
               <Skeleton className="h-48 w-full rounded-lg" />
               <Skeleton className="h-64 w-full rounded-lg" />
            </div>
         }
      >
         <ArtistDetail ratingKey={ratingKey} />
      </Suspense>
   );
};
export default ArtistPage;
