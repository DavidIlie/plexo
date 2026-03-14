import type { Metadata } from "next";
import { caller } from "~/trpc/server";

export const generateMetadata = async (): Promise<Metadata> => {
   const { data } = await caller.analytics.getDashboardStats();
   const desc = `Browse ${data.totalShows} TV shows in the library`;
   return {
      title: `TV Shows (${data.totalShows})`,
      description: desc,
      openGraph: {
         title: `TV Shows (${data.totalShows})`,
         description: desc,
         images: [{ url: "/og?page=tv", width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", images: ["/og?page=tv"] },
   };
};

const TVLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default TVLayout;
