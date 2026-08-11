import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getChildren, getMetadata } from "~/lib/plex";
import { getMediaDossierCached } from "~/server/cache/history";
import { MediaDossier } from "~/components/media/media-dossier";
import { MediaDossierFallback } from "~/components/media/media-dossier-fallback";
import type { DossierSeason } from "~/components/media/dossier-episode-map";

interface MediaPageProps {
   params: Promise<{ ratingKey: string }>;
}

export const generateMetadata = async ({
   params,
}: MediaPageProps): Promise<Metadata> => {
   const { ratingKey } = await params;
   const item = await getMetadata(ratingKey).catch(() => null);
   if (!item || (item.type !== "movie" && item.type !== "show")) {
      return { title: "Media Not Found" };
   }

   const description = item.summary
      ? item.summary.slice(0, 160)
      : `Viewing history and analytics for ${item.title}`;

   return {
      title: `${item.title} Analytics`,
      description,
      openGraph: {
         siteName: "Plexo",
         type: "website",
         title: `${item.title} Analytics`,
         description,
         url: `/media/${ratingKey}`,
      },
   };
};

const MediaContent = async ({ params }: MediaPageProps) => {
   const { ratingKey } = await params;
   const item = await getMetadata(ratingKey).catch(() => null);

   if (!item || (item.type !== "movie" && item.type !== "show")) {
      notFound();
   }

   const [dossier, children] = await Promise.all([
      getMediaDossierCached(ratingKey),
      item.type === "show" ? getChildren(ratingKey) : Promise.resolve([]),
   ]);
   const seasons: DossierSeason[] = children
      .filter((season) => (season.index ?? 0) > 0)
      .map((season) => ({
         index: season.index ?? 0,
         title: season.title,
         episodeCount: season.leafCount ?? 0,
      }));

   return <MediaDossier item={item} dossier={dossier} seasons={seasons} />;
};

const MediaPage = (props: MediaPageProps) => (
   <Suspense fallback={<MediaDossierFallback />}>
      <MediaContent {...props} />
   </Suspense>
);

export default MediaPage;
