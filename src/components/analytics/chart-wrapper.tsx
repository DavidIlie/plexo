"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer } from "recharts";

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
   height?: number;
   children: ReactNode;
   headerRight?: ReactNode;
}

export const ChartWrapper = ({
   title,
   description,
   isLoading,
   height = 280,
   children,
   headerRight,
}: ChartWrapperProps) => {
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
            <p className="text-sm font-medium">{title}</p>
            {headerRight}
         </div>
         {description && (
            <p className="mb-3 text-xs text-muted-foreground">{description}</p>
         )}
         <ResponsiveContainer width="100%" height={height}>
            {children}
         </ResponsiveContainer>
      </motion.div>
   );
};
