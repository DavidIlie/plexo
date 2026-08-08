import type { Metadata } from "next";

const desc = "Full watch and listening history";

export const metadata: Metadata = {
   title: "Activity",
   description: desc,
   openGraph: {
      siteName: "Plexo",
      type: "website",
      title: "Activity",
      description: desc,
      url: "/activity",
      images: [{ url: "/og?page=activity", width: 1200, height: 630 }],
   },
   twitter: { card: "summary_large_image", images: ["/og?page=activity"] },
};

const ActivityLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default ActivityLayout;
