import type { Metadata } from "next";
import { caller } from "~/trpc/server";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   return {
      title: `TV Shows (${data.totalShows})`,
      description: `Browse ${data.totalShows} TV shows in the library`,
   };
};

const TVLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default TVLayout;
