"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";

import { Skeleton } from "~/components/ui/skeleton";

export const CHART_TOOLTIP_STYLE: CSSProperties = {
   backgroundColor: "var(--card)",
   border: "1px solid var(--border)",
   borderRadius: "var(--radius)",
   color: "var(--foreground)",
   fontSize: "12px",
};

interface ChartWrapperProps {
   title: string;
   description?: string;
   isLoading: boolean;
   isFetching?: boolean;
   lastUpdatedAt?: string;
   height?: number;
   children: ReactNode;
   headerRight?: ReactNode;
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
}: ChartWrapperProps) => {
   const isRefetching = isFetching && !isLoading;

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
            <Skeleton className="w-full" style={{ height }} />
         </div>
      );
   }

   return (
      <motion.div
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
         <div className={isRefetching ? "opacity-60 transition-opacity duration-300" : ""}>
            <ResponsiveContainer width="100%" height={height}>
               {children}
            </ResponsiveContainer>
         </div>
         {lastUpdatedAt && (
            <p className="mt-2 text-right text-[10px] text-muted-foreground/60">
               {isRefetching
                  ? `Refreshing\u2026 last updated ${formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}`
                  : `Updated ${formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}`}
            </p>
         )}
      </motion.div>
   );
};
