"use client";

import type { CSSProperties, ReactNode } from "react";
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
}

export const ChartWrapper = ({
   title,
   description,
   isLoading,
   height = 280,
   children,
}: ChartWrapperProps) => {
   if (isLoading) {
      return (
         <div className="rounded-lg border border-border/50 p-4">
            <p className="mb-1 text-sm font-medium">{title}</p>
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
      <div className="rounded-lg border border-border/50 p-4">
         <p className="mb-1 text-sm font-medium">{title}</p>
         {description && (
            <p className="mb-3 text-xs text-muted-foreground">{description}</p>
         )}
         <ResponsiveContainer width="100%" height={height}>
            {children}
         </ResponsiveContainer>
      </div>
   );
};
