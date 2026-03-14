import type { Metadata } from "next";
import { caller } from "~/trpc/server";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   return {
      title: "Analytics",
      description: `Watch analytics: ${data.hoursWatched.toLocaleString()} hours across ${data.totalMovies} movies and ${data.totalShows} shows`,
   };
};

const AnalyticsLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default AnalyticsLayout;
