import type { Metadata } from "next";

export const metadata: Metadata = {
   title: "Activity",
   description: "Full watch and listening history",
};

const ActivityLayout = ({ children }: { children: React.ReactNode }) => {
   return <>{children}</>;
};
export default ActivityLayout;
