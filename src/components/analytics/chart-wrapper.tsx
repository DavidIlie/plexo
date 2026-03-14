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
   isLoading: boolean;
   height?: number;
   children: ReactNode;
}

export const ChartWrapper = ({
   title,
   isLoading,
   height = 280,
   children,
}: ChartWrapperProps) => {
   if (isLoading) {
      return (
         <div className="rounded-lg border border-border/50 p-4">
            <p className="mb-3 text-sm font-medium">{title}</p>
            <Skeleton className="w-full" style={{ height }} />
         </div>
      );
   }

   return (
      <div className="rounded-lg border border-border/50 p-4">
         <p className="mb-3 text-sm font-medium">{title}</p>
         <ResponsiveContainer width="100%" height={height}>
            {children}
         </ResponsiveContainer>
      </div>
   );
};
