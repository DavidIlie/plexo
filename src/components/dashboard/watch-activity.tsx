"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Flame, Trophy } from "lucide-react";
import {
   animate,
   m,
   useInView,
   useMotionValue,
   useReducedMotion,
   useTransform,
} from "framer-motion";

import type { WatchActivityData, WatchDay } from "~/types/watch-activity";

const ease = [0.23, 1, 0.32, 1] as const;

const levelClass: Record<0 | 1 | 2 | 3 | 4, string> = {
   0: "bg-muted",
   1: "bg-primary/25",
   2: "bg-primary/45",
   3: "bg-primary/70",
   4: "bg-primary",
};

// Human-readable bucket labels matching watchLevel() in server/cache/stats.ts.
const levelLabel: Record<0 | 1 | 2 | 3 | 4, string> = {
   0: "No plays",
   1: "1 play",
   2: "2–3 plays",
   3: "4–6 plays",
   4: "7+ plays",
};

// One-time populate sweep: total spread of per-column start delays (ms) plus a
// tiny per-row offset for organic diagonal feel. Kept under ~900ms end-to-end
// (SWEEP + last-row offset + the 300ms cell animation defined in globals.css).
const POPULATE_SWEEP_MS = 480;
const POPULATE_ROW_STEP_MS = 14;

function CountUp({
   value,
   inView,
   reduce,
   className,
}: {
   value: number;
   inView: boolean;
   reduce: boolean;
   className?: string;
}) {
   // Initialized to the real value so static contexts (SSR, print, captures)
   // never show "0"; the count-up rewinds to 0 only when it actually plays.
   const count = useMotionValue(value);
   const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
   const started = useRef(false);
   useEffect(() => {
      if (!inView) return;
      if (reduce) {
         count.set(value);
         return;
      }
      if (!started.current) {
         started.current = true;
         count.set(0);
      }
      const controls = animate(count, value, {
         duration: 1.6,
         ease,
      });
      return () => controls.stop();
   }, [inView, value, count, reduce]);
   return <m.span className={className}>{rounded}</m.span>;
}

function formatDate(iso: string) {
   const d = new Date(`${iso}T00:00:00Z`);
   return d.toLocaleDateString("en", {
      weekday: "short",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
   });
}

export function WatchActivityGraph({ data }: { data: WatchActivityData }) {
   const rootRef = useRef<HTMLDivElement>(null);
   const inView = useInView(rootRef, { once: true, amount: 0.15 });
   const [hover, setHover] = useState<WatchDay | null>(null);
   const reduce = useReducedMotion() ?? false;

   // Roving focus: the grid is a single tab stop; arrows move between days
   // (up/down = adjacent day, left/right = same weekday in adjacent week).
   const allDays = useMemo(
      () => data.weeks.flatMap((w) => w.days),
      [data.weeks],
   );
   const [focusedDate, setFocusedDate] = useState<string | null>(null);
   const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
   const entryDate = focusedDate ?? allDays[allDays.length - 1]?.date;

   const onGridKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
         if (!entryDate) return;
         const deltas: Partial<Record<string, number>> = {
            ArrowUp: -1,
            ArrowDown: 1,
            ArrowLeft: -7,
            ArrowRight: 7,
         };
         const delta = deltas[e.key];
         if (delta === undefined) return;
         e.preventDefault();
         const idx = allDays.findIndex((d) => d.date === entryDate);
         if (idx === -1) return;
         const next =
            allDays[Math.min(allDays.length - 1, Math.max(0, idx + delta))];
         if (!next) return;
         setFocusedDate(next.date);
         cellRefs.current.get(next.date)?.focus();
      },
      [allDays, entryDate],
   );

   // Stable callbacks so the memoized grid never re-renders on hover — only
   // the small footer readout subtree tracks `hover` state.
   const onHoverCell = useCallback((d: WatchDay | null) => setHover(d), []);
   const onFocusCell = useCallback((d: WatchDay) => {
      setHover(d);
      setFocusedDate(d.date);
   }, []);
   const registerCell = useCallback(
      (date: string, el: HTMLButtonElement | null) => {
         if (el) cellRefs.current.set(date, el);
         else cellRefs.current.delete(date);
      },
      [],
   );

   const totalWeeks = data.weeks.length;
   const MOBILE_WEEKS = 26; // last ~6 months on mobile
   const mobileStart = Math.max(0, totalWeeks - MOBILE_WEEKS);
   const mobileVisibleCount = totalWeeks - mobileStart;

   // Month labels — one per unique month, positioned at the first week it appears
   const monthLabels = useMemo(() => {
      const labels: { label: string; weekIndex: number }[] = [];
      let last = -1;
      data.weeks.forEach((w, i) => {
         const first = w.days[0];
         if (!first) return;
         const m = new Date(`${first.date}T00:00:00Z`).getUTCMonth();
         if (m !== last && i > 0) {
            labels.push({
               label: new Date(`${first.date}T00:00:00Z`).toLocaleString("en", {
                  month: "short",
                  timeZone: "UTC",
               }),
               weekIndex: i,
            });
            last = m;
         } else if (last === -1) {
            last = m;
         }
      });
      return labels;
   }, [data.weeks]);

   // Mobile-only month labels — only months within the last MOBILE_WEEKS, repositioned
   const mobileMonthLabels = useMemo(
      () =>
         monthLabels
            .filter((m) => m.weekIndex >= mobileStart)
            .map((m) => ({
               label: m.label,
               leftPct:
                  ((m.weekIndex - mobileStart) / mobileVisibleCount) * 100,
            })),
      [monthLabels, mobileStart, mobileVisibleCount],
   );

   return (
      <div
         ref={rootRef}
         // Intentional hero treatment (rounded-2xl + gradient) — the border
         // token matches the rest of the card system.
         className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 via-card/50 to-muted/30 p-5 sm:p-7"
      >
         {/* Decorative glow */}
         <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
         />

         {/* Header */}
         <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
               <div className="mb-1.5 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                  <Clapperboard className="h-3 w-3" />
                  <span>watch activity</span>
                  <span
                     aria-hidden
                     className="inline-flex h-1.5 w-1.5 rounded-full bg-primary"
                  />
                  <span className="sm:hidden">last 6 months shown</span>
                  <span className="hidden sm:inline">last 365 days</span>
               </div>
               <div className="flex items-baseline gap-2">
                  <CountUp
                     value={data.total}
                     inView={inView}
                     reduce={reduce}
                     className="text-3xl font-bold tracking-tight sm:text-4xl"
                  />
                  <span className="text-sm text-muted-foreground">
                     plays in the last 365 days
                  </span>
               </div>
            </div>

            {/* Streak stats */}
            <div className="flex gap-3">
               <StatPill
                  icon={<Flame className="h-3.5 w-3.5" />}
                  label="current"
                  value={`${data.currentStreak}d`}
                  inView={inView}
                  reduce={reduce}
                  delay={0.2}
               />
               <StatPill
                  icon={<Trophy className="h-3.5 w-3.5" />}
                  label="longest"
                  value={`${data.longestStreak}d`}
                  inView={inView}
                  reduce={reduce}
                  delay={0.3}
               />
            </div>
         </div>

         {/* Graph — fluid width, no horizontal scroll */}
         <div className="relative">
            {/* Month labels — mobile (last 6 months) */}
            <div className="relative mb-2 ml-[28px] h-3 text-[0.65rem] text-muted-foreground sm:hidden">
               {mobileMonthLabels.map(({ label, leftPct }, i) => (
                  <span
                     key={`m-${label}-${i}`}
                     className="absolute top-0 -translate-x-0.5"
                     style={{ left: `${leftPct}%` }}
                  >
                     {label}
                  </span>
               ))}
            </div>
            {/* Month labels — desktop (full year) */}
            <div className="relative mb-2 hidden h-3 text-[0.65rem] text-muted-foreground sm:ml-8 sm:block">
               {monthLabels.map(({ label, weekIndex }) => (
                  <span
                     key={`${label}-${weekIndex}`}
                     className="absolute top-0 -translate-x-0.5"
                     style={{
                        left: `${(weekIndex / totalWeeks) * 100}%`,
                     }}
                  >
                     {label}
                  </span>
               ))}
            </div>

            {/* Grid row */}
            <div className="flex items-stretch gap-1.5">
               {/* Day labels */}
               <div className="flex w-[22px] shrink-0 flex-col justify-between py-0 text-[0.6rem] leading-none text-muted-foreground sm:w-6 sm:text-[0.65rem]">
                  {/* positioned to align with rows 1 (Mon), 3 (Wed), 5 (Fri) */}
                  <span className="h-[calc((100%-6*0.2rem)/7)]" />
                  <span className="h-[calc((100%-6*0.2rem)/7)] leading-[1]">
                     Mon
                  </span>
                  <span className="h-[calc((100%-6*0.2rem)/7)]" />
                  <span className="h-[calc((100%-6*0.2rem)/7)] leading-[1]">
                     Wed
                  </span>
                  <span className="h-[calc((100%-6*0.2rem)/7)]" />
                  <span className="h-[calc((100%-6*0.2rem)/7)] leading-[1]">
                     Fri
                  </span>
                  <span className="h-[calc((100%-6*0.2rem)/7)]" />
               </div>

               <WeeksGrid
                  weeks={data.weeks}
                  totalWeeks={totalWeeks}
                  mobileStart={mobileStart}
                  mobileVisibleCount={mobileVisibleCount}
                  reduce={reduce}
                  inView={inView}
                  entryDate={entryDate}
                  onGridKeyDown={onGridKeyDown}
                  onHoverCell={onHoverCell}
                  onFocusCell={onFocusCell}
                  registerCell={registerCell}
               />
            </div>
         </div>

         {/* Footer: tooltip swap + legend */}
         <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-h-[1.5rem] text-xs">
               {hover ? (
                  <m.div
                     key={hover.date}
                     initial={reduce ? false : { opacity: 0, y: 4 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: reduce ? 0 : 0.2 }}
                     className="flex items-baseline gap-2"
                  >
                     <span className="font-semibold text-foreground">
                        {hover.count}
                     </span>
                     <span className="text-muted-foreground">
                        {hover.count === 1 ? "play" : "plays"} on{" "}
                        {formatDate(hover.date)}
                     </span>
                  </m.div>
               ) : data.busiestDay ? (
                  <m.button
                     type="button"
                     initial={reduce ? false : { opacity: 0, y: 4 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={
                        reduce
                           ? { duration: 0 }
                           : { duration: 0.3, delay: 1 }
                     }
                     onClick={() => {
                        const date = data.busiestDay?.date;
                        if (!date) return;
                        setFocusedDate(date);
                        cellRefs.current.get(date)?.focus();
                     }}
                     className="flex cursor-pointer items-baseline gap-2 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
                     aria-label={`Jump to busiest day, ${formatDate(data.busiestDay.date)}`}
                  >
                     <span>Busiest day:</span>
                     <span className="font-semibold text-foreground">
                        {data.busiestDay.count}
                     </span>
                     <span>on {formatDate(data.busiestDay.date)}</span>
                  </m.button>
               ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
               <span>Less</span>
               {([0, 1, 2, 3, 4] as const).map((l) => (
                  <span
                     key={l}
                     title={levelLabel[l]}
                     className={`h-3 w-3 rounded-[3px] ${levelClass[l]}`}
                  />
               ))}
               <span>More</span>
            </div>
         </div>
      </div>
   );
}

interface WeeksGridProps {
   weeks: WatchActivityData["weeks"];
   totalWeeks: number;
   mobileStart: number;
   mobileVisibleCount: number;
   reduce: boolean;
   inView: boolean;
   entryDate: string | undefined;
   onGridKeyDown: (e: React.KeyboardEvent) => void;
   onHoverCell: (d: WatchDay | null) => void;
   onFocusCell: (d: WatchDay) => void;
   registerCell: (date: string, el: HTMLButtonElement | null) => void;
}

/* Cells — each week = flex-1 column of 7 aspect-square cells.
   The staggered populate is a one-time CSS sweep (see .watch-cell-animate in
   globals.css): cells stay paused until the grid scrolls into view and gains
   `watch-grid-visible`, then fade/scale in on a per-column delay. It never
   re-runs on data refetch since the cells keep their stable `d.date` keys and
   are not remounted.

   Memoized so hovering (which only feeds the footer readout) never re-renders
   the ~365 buttons; the hover ring itself is pure CSS on the button. */
const WeeksGrid = React.memo(function WeeksGrid({
   weeks,
   totalWeeks,
   mobileStart,
   mobileVisibleCount,
   reduce,
   inView,
   entryDate,
   onGridKeyDown,
   onHoverCell,
   onFocusCell,
   registerCell,
}: WeeksGridProps) {
   return (
      <div
         onKeyDown={onGridKeyDown}
         className={`flex flex-1 gap-[3px] sm:gap-1 ${
            !reduce && inView ? "watch-grid-visible" : ""
         }`}
      >
         {weeks.map((w, wi) => {
            const desktopDelay =
               totalWeeks > 1
                  ? (wi / (totalWeeks - 1)) * POPULATE_SWEEP_MS
                  : 0;
            const mobileDelay =
               wi < mobileStart
                  ? 0
                  : mobileVisibleCount > 1
                    ? ((wi - mobileStart) / (mobileVisibleCount - 1)) *
                      POPULATE_SWEEP_MS
                    : 0;
            return (
               <div
                  key={wi}
                  className={`min-w-0 flex-1 flex-col gap-[3px] sm:flex sm:gap-1 ${
                     wi < mobileStart ? "hidden" : "flex"
                  }`}
               >
                  {Array.from({ length: 7 }).map((_, di) => {
                     const d = w.days.find((x) => x.weekday === di);
                     if (!d) {
                        return (
                           <div
                              key={di}
                              className="aspect-square w-full"
                           />
                        );
                     }
                     const rowOffset = di * POPULATE_ROW_STEP_MS;
                     const cellStyle = {
                        "--wd": `${desktopDelay + rowOffset}ms`,
                        "--wm": `${mobileDelay + rowOffset}ms`,
                     } as React.CSSProperties;
                     return (
                        <button
                           key={d.date}
                           type="button"
                           style={reduce ? undefined : cellStyle}
                           tabIndex={d.date === entryDate ? 0 : -1}
                           ref={(el: HTMLButtonElement | null) => {
                              registerCell(d.date, el);
                           }}
                           aria-label={`${d.count} ${
                              d.count === 1 ? "play" : "plays"
                           } on ${formatDate(d.date)}`}
                           onMouseEnter={() => onHoverCell(d)}
                           onMouseLeave={() => onHoverCell(null)}
                           onFocus={() => onFocusCell(d)}
                           onBlur={() => onHoverCell(null)}
                           className={`relative aspect-square w-full rounded-[3px] ring-offset-card transition-transform duration-150 ease-out outline-none hover:z-10 hover:scale-125 hover:ring-2 hover:ring-primary hover:ring-offset-2 focus-visible:z-10 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                              levelClass[d.level]
                           } ${reduce ? "" : "watch-cell-animate"}`}
                        />
                     );
                  })}
               </div>
            );
         })}
      </div>
   );
});

function StatPill({
   icon,
   label,
   value,
   inView,
   reduce,
   delay,
}: {
   icon: React.ReactNode;
   label: string;
   value: string;
   inView: boolean;
   reduce: boolean;
   delay: number;
}) {
   return (
      <m.div
         initial={reduce ? false : { opacity: 0, y: 8 }}
         animate={
            reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
         }
         transition={reduce ? { duration: 0 } : { duration: 0.5, ease, delay }}
         className="flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1.5 backdrop-blur-sm"
      >
         <span className="text-primary">{icon}</span>
         <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold">{value}</span>
            <span className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
               {label}
            </span>
         </div>
      </m.div>
   );
}
