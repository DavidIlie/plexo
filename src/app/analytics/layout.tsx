import type { Metadata } from "next";
import { caller } from "~/trpc/server";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   const desc = `Watch analytics: ${data.hoursWatched.toLocaleString()} hours across ${data.totalMovies} movies and ${data.totalShows} shows`;
   return {
      title: "Analytics",
      description: desc,
      openGraph: {
         title: "Analytics",
         description: desc,
         images: [{ url: "/og?page=analytics", width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", images: ["/og?page=analytics"] },
   };
};

const AnalyticsLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default AnalyticsLayout;
