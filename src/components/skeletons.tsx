import { Skeleton } from "~/components/ui/skeleton";

const posterGrid =
   "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
const musicGrid =
   "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7";

export const MediaGridFallback = ({
   count = 18,
   variant = "poster",
}: {
   count?: number;
   variant?: "poster" | "music";
}) => (
   <div className={variant === "music" ? musicGrid : posterGrid}>
      {Array.from({ length: count }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

export const LoadMoreSkeleton = ({
   count = 6,
   variant = "poster",
}: {
   count?: number;
   variant?: "poster" | "music";
}) => (
   <div className={variant === "music" ? musicGrid : posterGrid}>
      {Array.from({ length: count }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

export const ChartFallback = ({ height = 256 }: { height?: number }) => (
   <Skeleton className="w-full rounded-lg" style={{ height }} />
);
