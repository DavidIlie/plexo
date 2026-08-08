import { Skeleton } from "~/components/ui/skeleton";

// Single source of truth for media grid columns — MediaGrid, ArtistsBrowser,
// and every fallback use the same classes so streaming never reflows columns.
export const MEDIA_GRID_CLASSES =
   "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7";

export const MediaGridFallback = ({
   count = 18,
}: {
   count?: number;
   variant?: "poster" | "music";
}) => (
   <div className={MEDIA_GRID_CLASSES}>
      {Array.from({ length: count }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

export const LoadMoreSkeleton = ({
   count = 6,
}: {
   count?: number;
   variant?: "poster" | "music";
}) => (
   <div className={MEDIA_GRID_CLASSES}>
      {Array.from({ length: count }).map((_, i) => (
         <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
      ))}
   </div>
);

// Matches a rendered ChartWrapper card: p-4 (32) + header row (~24) + 280
// chart + updated-at line (~18) ≈ 354px, rounded to 340 with margins collapsed.
export const ChartFallback = ({ height = 340 }: { height?: number }) => (
   <Skeleton className="w-full rounded-lg" style={{ height }} />
);
