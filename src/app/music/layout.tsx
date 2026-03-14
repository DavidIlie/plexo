import type { Metadata } from "next";
import { caller } from "~/trpc/server";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   const count = data.totalArtists ?? 0;
   const desc = `Browse ${count} artists in the library`;
   return {
      title: `Music (${count} artists)`,
      description: desc,
      openGraph: {
         title: `Music (${count} artists)`,
         description: desc,
         images: [{ url: "/og?page=music", width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", images: ["/og?page=music"] },
   };
};

const MusicLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default MusicLayout;
