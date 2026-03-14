import type { Metadata } from "next";
import { caller } from "~/trpc/server";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   return {
      title: `Movies (${data.totalMovies})`,
      description: `Browse ${data.totalMovies} movies in the library`,
   };
};

const MoviesLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default MoviesLayout;
