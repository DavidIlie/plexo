"use client";

import type { CSSProperties, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export const CHART_TOOLTIP_STYLE: CSSProperties = {
   backgroundColor: "var(--card)",
   border: "1px solid var(--border)",
   borderRadius: "var(--radius)",
   color: "var(--foreground)",
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
   height = 300,
   children,
}: ChartWrapperProps) => {
   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
               <Skeleton className="w-full" style={{ height }} />
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
         </CardHeader>
         <CardContent>
            <ResponsiveContainer width="100%" height={height}>
               {children}
            </ResponsiveContainer>
         </CardContent>
      </Card>
   );
};
