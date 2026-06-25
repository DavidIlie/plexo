"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { ChartWrapper, CHART_TOOLTIP_STYLE } from "~/components/analytics/chart-wrapper";

interface VerticalBarChartProps {
   data: Array<{ name: string; count?: number; plays?: number }>;
   dataKey: "count" | "plays";
   fill: string;
   title: string;
   description?: string;
   lastUpdatedAt?: string;
   yWidth?: number;
   tickFontSize?: number;
   slice?: number;
}

export const VerticalBarChart = ({
   data,
   dataKey,
   fill,
   title,
   description,
   lastUpdatedAt,
   yWidth = 90,
   tickFontSize = 11,
   slice,
}: VerticalBarChartProps) => {
   const chartData = slice ? data.slice(0, slice) : data;
   if (chartData.length === 0) return null;

   return (
      <ChartWrapper
         title={title}
         description={description}
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="var(--muted-foreground)" />
            <YAxis
               type="category"
               dataKey="name"
               width={yWidth}
               stroke="var(--muted-foreground)"
               tick={{ fontSize: tickFontSize }}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey={dataKey} fill={fill} radius={[0, 4, 4, 0]} />
         </BarChart>
      </ChartWrapper>
   );
};
