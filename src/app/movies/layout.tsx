import type { Metadata } from "next";
import { connection } from "next/server";
import { getDashboardStatsCached } from "~/server/cache/stats";

export const generateMetadata = async (): Promise<Metadata> => {
   await connection();
   try {
      const data = await getDashboardStatsCached();
      const desc = `Browse ${data.totalMovies} movies in the library`;
      return {
         title: `Movies (${data.totalMovies})`,
         description: desc,
         openGraph: {
            siteName: "Plexo",
            type: "website",
            title: `Movies (${data.totalMovies})`,
            description: desc,
            url: "/movies",
            images: [{ url: "/og?page=movies", width: 1200, height: 630 }],
         },
         twitter: { card: "summary_large_image", images: ["/og?page=movies"] },
      };
   } catch {
      return {
         title: "Movies",
         description: "Browse movies in the library",
         openGraph: {
            siteName: "Plexo",
            type: "website",
            title: "Movies",
            description: "Browse movies in the library",
            url: "/movies",
            images: [{ url: "/og?page=movies", width: 1200, height: 630 }],
         },
         twitter: { card: "summary_large_image", images: ["/og?page=movies"] },
      };
   }
};

const MoviesLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default MoviesLayout;
