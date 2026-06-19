import type { Metadata } from "next";
import { getDashboardStatsCached } from "~/server/cache/stats";

export const generateMetadata = async (): Promise<Metadata> => {
   const data = await getDashboardStatsCached();
   const desc = `Browse ${data.totalMovies} movies in the library`;
   return {
      title: `Movies (${data.totalMovies})`,
      description: desc,
      openGraph: {
         title: `Movies (${data.totalMovies})`,
         description: desc,
         images: [{ url: "/og?page=movies", width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", images: ["/og?page=movies"] },
   };
};

const MoviesLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default MoviesLayout;
