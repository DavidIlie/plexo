import type { Metadata } from "next";
import { connection } from "next/server";
import { getDashboardStatsCached } from "~/server/cache/stats";

export const generateMetadata = async (): Promise<Metadata> => {
   await connection();
   try {
      const data = await getDashboardStatsCached();
      const desc = `Browse ${data.totalShows} TV shows in the library`;
      return {
         title: `TV Shows (${data.totalShows})`,
         description: desc,
         openGraph: {
            siteName: "Plexo",
            type: "website",
            title: `TV Shows (${data.totalShows})`,
            description: desc,
            url: "/tv",
            images: [{ url: "/og?page=tv", width: 1200, height: 630 }],
         },
         twitter: { card: "summary_large_image", images: ["/og?page=tv"] },
      };
   } catch {
      return {
         title: "TV Shows",
         description: "Browse TV shows in the library",
         openGraph: {
            siteName: "Plexo",
            type: "website",
            title: "TV Shows",
            description: "Browse TV shows in the library",
            url: "/tv",
            images: [{ url: "/og?page=tv", width: 1200, height: 630 }],
         },
         twitter: { card: "summary_large_image", images: ["/og?page=tv"] },
      };
   }
};

const TVLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default TVLayout;
