"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Flame, Trophy } from "lucide-react";
import {
   animate,
   motion,
   useInView,
   useMotionValue,
   useReducedMotion,
   useTransform,
   type Variants,
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

const weekVariants: Variants = {
   hidden: {},
   show: {
      transition: { staggerChildren: 0.008 },
   },
};

const dayVariants: Variants = {
   hidden: { opacity: 0, scale: 0.8, y: -2 },
   show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease },
   },
};

const containerVariants: Variants = {
   hidden: {},
   show: {
      transition: { staggerChildren: 0.006 },
   },
};

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
   const count = useMotionValue(0);
   const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
   useEffect(() => {
      if (!inView) return;
      if (reduce) {
         count.set(value);
         return;
      }
      const controls = animate(count, value, {
         duration: 1.6,
         ease,
      });
      return () => controls.stop();
   }, [inView, value, count, reduce]);
   return <motion.span className={className}>{rounded}</motion.span>;
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

   const onGridKeyDown = (e: React.KeyboardEvent) => {
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
   };

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
         className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card/80 via-card/50 to-muted/30 p-5 sm:p-7"
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

               {/* Cells — each week = flex-1 column of 7 aspect-square cells */}
               <motion.div
                  variants={containerVariants}
                  initial={reduce ? "show" : "hidden"}
                  animate={reduce || inView ? "show" : "hidden"}
                  onKeyDown={onGridKeyDown}
                  className="flex flex-1 gap-[3px] sm:gap-1"
               >
                  {data.weeks.map((w, wi) => (
                     <motion.div
                        key={wi}
                        variants={weekVariants}
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
                           const isHot = hover?.date === d.date;
                           return (
                              <motion.button
                                 key={d.date}
                                 variants={dayVariants}
                                 type="button"
                                 tabIndex={d.date === entryDate ? 0 : -1}
                                 ref={(el: HTMLButtonElement | null) => {
                                    if (el) cellRefs.current.set(d.date, el);
                                    else cellRefs.current.delete(d.date);
                                 }}
                                 aria-label={`${d.count} ${
                                    d.count === 1 ? "play" : "plays"
                                 } on ${formatDate(d.date)}`}
                                 onMouseEnter={() => setHover(d)}
                                 onMouseLeave={() => setHover(null)}
                                 onFocus={() => {
                                    setHover(d);
                                    setFocusedDate(d.date);
                                 }}
                                 onBlur={() => setHover(null)}
                                 whileHover={
                                    reduce ? undefined : { scale: 1.4, zIndex: 5 }
                                 }
                                 transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 18,
                                 }}
                                 className={`aspect-square w-full rounded-[3px] ring-offset-card transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${levelClass[d.level]} ${
                                    isHot
                                       ? "ring-2 ring-primary ring-offset-2"
                                       : ""
                                 }`}
                              />
                           );
                        })}
                     </motion.div>
                  ))}
               </motion.div>
            </div>
         </div>

         {/* Footer: tooltip swap + legend */}
         <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-h-[1.5rem] text-xs">
               {hover ? (
                  <motion.div
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
                  </motion.div>
               ) : data.busiestDay ? (
                  <motion.div
                     initial={reduce ? false : { opacity: 0, y: 4 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={
                        reduce
                           ? { duration: 0 }
                           : { duration: 0.3, delay: 1 }
                     }
                     className="flex items-baseline gap-2 text-muted-foreground"
                  >
                     <span>Busiest day:</span>
                     <span className="font-semibold text-foreground">
                        {data.busiestDay.count}
                     </span>
                     <span>on {formatDate(data.busiestDay.date)}</span>
                  </motion.div>
               ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
               <span>Less</span>
               {[0, 1, 2, 3, 4].map((l) => (
                  <span
                     key={l}
                     className={`h-3 w-3 rounded-[3px] ${levelClass[l as 0 | 1 | 2 | 3 | 4]}`}
                  />
               ))}
               <span>More</span>
            </div>
         </div>
      </div>
   );
}

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
      <motion.div
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
      </motion.div>
   );
}
