"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";

import { Skeleton } from "~/components/ui/skeleton";

// Centered placeholder rendered via ChartWrapper's `empty` slot when a chart
// has no data — the card keeps its footprint instead of vanishing from the grid.
export const ChartEmptyState = ({ message = "No data yet" }: { message?: string }) => (
   <span className="text-[11px] text-muted-foreground">{message}</span>
);

interface ChartCardProps {
   title: string;
   description?: string;
   isRefetching?: boolean;
   lastUpdatedAt?: string;
   headerRight?: ReactNode;
   children?: ReactNode;
}

// Shared card chrome (border, padding, header, updated-at footer) for every
// analytics-style card — charts compose it via ChartWrapper, list cards like
// LocationChart use it directly so all cards in a grid match exactly.
export const ChartCard = ({
   title,
   description,
   isRefetching = false,
   lastUpdatedAt,
   headerRight,
   children,
}: ChartCardProps) => (
   <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-border/50 bg-card/50 p-4"
   >
      <div className="mb-1 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {isRefetching && (
               <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
         </div>
         {headerRight}
      </div>
      {description && (
         <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {lastUpdatedAt && (
         <p className="mt-2 text-right text-[10px] text-muted-foreground/60">
            {isRefetching
               ? `Refreshing… last updated ${formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}`
               : `Updated ${formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}`}
         </p>
      )}
   </m.div>
);

interface ChartWrapperProps {
   title: string;
   description?: string;
   isLoading: boolean;
   isFetching?: boolean;
   lastUpdatedAt?: string;
   height?: number;
   children?: ReactNode;
   headerRight?: ReactNode;
   // Rendered centered over the chart area (e.g. a donut's center readout).
   // Shares the ResponsiveContainer's exact box, so flex-centering matches a
   // cx/cy 50% pie at every width.
   overlay?: ReactNode;
   // When set, rendered centered in place of the chart (children are ignored).
   empty?: ReactNode;
}

export const ChartWrapper = ({
   title,
   description,
   isLoading,
   isFetching = false,
   lastUpdatedAt,
   height = 280,
   children,
   headerRight,
   overlay,
   empty,
}: ChartWrapperProps) => {
   const isRefetching = isFetching && !isLoading;
   // Shrink chart area on phones without a JS media query: 60vw bottoms out at
   // 220px and never exceeds the configured height.
   const responsiveHeight = `clamp(220px, 60vw, ${height}px)`;

   if (isLoading) {
      return (
         <div className="rounded-lg border border-border/50 bg-card/50 p-4">
            <div className="mb-1 flex items-center justify-between">
               <p className="text-sm font-medium">{title}</p>
               {headerRight}
            </div>
            {description && (
               <p className="mb-3 text-xs text-muted-foreground">
                  {description}
               </p>
            )}
            <Skeleton className="w-full" style={{ height: responsiveHeight }} />
         </div>
      );
   }

   return (
      <ChartCard
         title={title}
         description={description}
         isRefetching={isRefetching}
         lastUpdatedAt={lastUpdatedAt}
         headerRight={headerRight}
      >
         <div className={isRefetching ? "opacity-60 transition-opacity duration-300" : ""}>
            {empty != null ? (
               <div
                  className="flex w-full items-center justify-center"
                  style={{ height: responsiveHeight }}
               >
                  {empty}
               </div>
            ) : (
               <div className="relative" style={{ height: responsiveHeight }}>
                  <ResponsiveContainer
                     width="100%"
                     height="100%"
                     initialDimension={{ width: 600, height }}
                  >
                     {children}
                  </ResponsiveContainer>
                  {overlay != null && (
                     <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        {overlay}
                     </div>
                  )}
               </div>
            )}
         </div>
      </ChartCard>
   );
};
