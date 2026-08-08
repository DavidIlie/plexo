"use client";

import { useDeferredValue, useId, useMemo } from "react";
import { AreaChart, Area, CartesianGrid, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format } from "date-fns";

import type { TautulliPlaysByDate } from "~/types/tautulli";
import { ChartWrapper } from "~/components/analytics/chart-wrapper";
import {
   ACTIVE_DOT,
   CHART_CURSOR,
   HOVER_SERIES_OPACITY,
   MOUNT_ANIMATION,
   PulseDot,
   useChartHover,
} from "~/components/analytics/chart-motion";
import {
   ChartTooltipCard,
   ChartTooltipRow,
} from "~/components/analytics/chart-tooltip";

interface Props {
   data: TautulliPlaysByDate;
   timeRange?: number;
   lastUpdatedAt?: string;
}

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];

type Row = Record<string, number | string | null>;

interface TooltipEntry {
   series: Array<{ name: string; color: string; value: number }>;
   total: number;
}

interface TrendsTooltipProps {
   active?: boolean;
   label?: string | number;
}

export const MonthlyTrendsChart: React.FC<Props> = ({
   data,
   timeRange = 365,
   lastUpdatedAt,
}) => {
   const uid = useId();
   const { hoverIdx, hovering, baseAnimate, onMouseMove, onMouseLeave } =
      useChartHover();
   // The hover accent rebuilds the full row array (365 dates x 3 keys per
   // series), so defer it: pointer tracking (tooltip/cursor) stays at frame
   // rate while the accent recompute lags a frame at most.
   const deferredHoverIdx = useDeferredValue(hoverIdx);

   const seriesMeta = useMemo(
      () =>
         data.series.map((s, index) => ({
            name: s.name,
            color: COLORS[index % COLORS.length],
            gradientId: `${uid}-${index}`,
         })),
      [data.series, uid],
   );

   const lastIndex = data.categories.length - 1;
   const secondToLast = lastIndex - 1;

   // Row objects carry three keyed views per series: the solid `name` (drawn up
   // to the second-to-last bucket), the dashed `__tail` (last two buckets, the
   // still-accumulating live edge), and the hover-only accent `__left` (points
   // at or before the cursor). Recomputed on hover so the accent overlay tracks
   // the cursor without a clipPath.
   const chartData = useMemo<Row[]>(
      () =>
         data.categories.map((date, index) => {
            const row: Row = {
               date,
               liveEdge: index === lastIndex ? 1 : 0,
            };
            for (const series of data.series) {
               const value = series.data[index] ?? 0;
               row[series.name] = index <= secondToLast ? value : null;
               row[`${series.name}__tail`] =
                  index >= secondToLast ? value : null;
               row[`${series.name}__left`] =
                  deferredHoverIdx !== null && index <= deferredHoverIdx
                     ? value
                     : null;
            }
            return row;
         }),
      [data.categories, data.series, deferredHoverIdx, lastIndex, secondToLast],
   );

   const byDate = useMemo(() => {
      const map = new Map<string, TooltipEntry>();
      data.categories.forEach((date, index) => {
         const series = seriesMeta.map((meta) => ({
            name: meta.name,
            color: meta.color,
            value:
               data.series.find((s) => s.name === meta.name)?.data[index] ?? 0,
         }));
         map.set(date, {
            series,
            total: series.reduce((sum, s) => sum + s.value, 0),
         });
      });
      return map;
   }, [data.categories, data.series, seriesMeta]);

   return (
      <ChartWrapper
         title="Watch Trends"
         description={`Daily plays over last ${timeRange} days`}
         isLoading={false}
         isFetching={false}
         lastUpdatedAt={lastUpdatedAt}
      >
         <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
         >
            <defs>
               {seriesMeta.map((meta) => (
                  <linearGradient
                     key={meta.gradientId}
                     id={meta.gradientId}
                     x1="0"
                     y1="0"
                     x2="0"
                     y2="1"
                  >
                     <stop offset="0%" stopColor={meta.color} stopOpacity={0.5} />
                     <stop
                        offset="100%"
                        stopColor={meta.color}
                        stopOpacity={0}
                     />
                  </linearGradient>
               ))}
            </defs>
            <CartesianGrid
               strokeDasharray="3 3"
               stroke="var(--border)"
               opacity={0.5}
               vertical={false}
            />
            <XAxis
               dataKey="date"
               tickLine={false}
               axisLine={false}
               minTickGap={32}
               tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
               tickFormatter={(value: string) => format(new Date(value), "M/d")}
            />
            <YAxis
               width={30}
               tickLine={false}
               axisLine={false}
               allowDecimals={false}
               domain={[0, (max: number) => Math.ceil(max * 1.15)]}
               tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
               tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
               }
            />
            <Tooltip
               cursor={CHART_CURSOR}
               content={({ active, label }: TrendsTooltipProps) => {
                  if (!active || label == null) return null;
                  const entry = byDate.get(String(label));
                  if (!entry) return null;
                  return (
                     <ChartTooltipCard
                        header={format(new Date(String(label)), "EEE, MMM d, yyyy")}
                     >
                        {entry.series.map((s) => (
                           <ChartTooltipRow
                              key={s.name}
                              color={s.color}
                              label={s.name}
                              value={s.value.toLocaleString()}
                           />
                        ))}
                        <ChartTooltipRow
                           muted
                           label="Total"
                           value={entry.total.toLocaleString()}
                        />
                     </ChartTooltipCard>
                  );
               }}
            />
            <Legend
               iconType="circle"
               iconSize={8}
               wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
               formatter={(value) => (
                  <span style={{ color: "var(--muted-foreground)" }}>{value}</span>
               )}
            />
            {seriesMeta.map((meta) => (
               <Area
                  key={meta.name}
                  type="monotone"
                  dataKey={meta.name}
                  name={meta.name}
                  stroke={hovering ? "var(--chart-hover-gray)" : meta.color}
                  strokeOpacity={hovering ? HOVER_SERIES_OPACITY : 1}
                  strokeWidth={2}
                  fill={`url(#${meta.gradientId})`}
                  fillOpacity={hovering ? 0 : 1}
                  connectNulls={false}
                  activeDot={{ ...ACTIVE_DOT, fill: meta.color }}
                  isAnimationActive={baseAnimate}
                  {...MOUNT_ANIMATION}
               />
            ))}
            {seriesMeta.map((meta) => (
               <Area
                  key={`${meta.name}__left`}
                  type="monotone"
                  dataKey={`${meta.name}__left`}
                  stroke={meta.color}
                  strokeWidth={2}
                  fill={`url(#${meta.gradientId})`}
                  fillOpacity={1}
                  connectNulls={false}
                  isAnimationActive={false}
                  tooltipType="none"
                  legendType="none"
                  activeDot={false}
               />
            ))}
            {seriesMeta.map((meta) => (
               <Line
                  key={`${meta.name}__tail`}
                  type="monotone"
                  dataKey={`${meta.name}__tail`}
                  stroke={hovering ? "var(--chart-hover-gray)" : meta.color}
                  strokeOpacity={hovering ? HOVER_SERIES_OPACITY : 1}
                  strokeWidth={2}
                  strokeDasharray="4 8"
                  strokeLinecap="round"
                  connectNulls={false}
                  legendType="none"
                  dot={<PulseDot color={meta.color} />}
                  activeDot={{ ...ACTIVE_DOT, fill: meta.color }}
                  isAnimationActive={baseAnimate}
                  {...MOUNT_ANIMATION}
               />
            ))}
         </AreaChart>
      </ChartWrapper>
   );
};
