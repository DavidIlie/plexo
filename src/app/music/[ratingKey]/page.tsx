import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
   caller,
   trpc,
   getQueryClient,
   HydrateClient,
} from "~/trpc/server";
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

   const queryClient = getQueryClient();
   void queryClient.prefetchQuery(
      trpc.plex.getMetadata.queryOptions({ ratingKey }),
   );
   void queryClient.prefetchQuery(
      trpc.plex.getChildren.queryOptions({ ratingKey }),
   );

   return (
      <HydrateClient>
         <ArtistDetail ratingKey={ratingKey} />
      </HydrateClient>
   );
};
export default ArtistPage;
