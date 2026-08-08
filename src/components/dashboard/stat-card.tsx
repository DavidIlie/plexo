"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Film, Tv, Eye, Clock, Music, Disc3, Library, type LucideIcon } from "lucide-react";

import { AnimatedNumber } from "~/components/ui/animated-number";

const icons: Record<string, LucideIcon> = { Film, Tv, Eye, Clock, Music, Disc3, Library };

interface StatCardProps {
   icon: string;
   label: string;
   value: string | number;
   index?: number;
}

// A plain formatted integer like "1,234" — digits with optional thousands
// separators, nothing else (no units, decimals, or letters).
const INTEGER_STRING = /^\d{1,3}(?:,\d{3})*$|^\d+$/;

const parseIntegerString = (value: string): number | null => {
   if (!INTEGER_STRING.test(value.trim())) return null;
   const parsed = Number(value.replace(/,/g, ""));
   return Number.isFinite(parsed) ? parsed : null;
};

export const StatCard: React.FC<StatCardProps> = ({
   icon,
   label,
   value,
   index = 0,
}) => {
   const Icon = icons[icon] ?? Film;
   const prefersReducedMotion = useReducedMotion();

   const numericValue =
      typeof value === "number" ? value : parseIntegerString(value);

   return (
      <m.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: index * 0.05 }}
         whileHover={
            prefersReducedMotion
               ? undefined
               : { y: -2, transition: { type: "spring", bounce: 0, duration: 0.4 } }
         }
         className="rounded-lg border border-border/50 bg-card p-4 transition-colors hover:border-primary/20"
      >
         <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs">{label}</span>
         </div>
         <p className="relative mt-1 overflow-hidden text-2xl font-semibold tabular-nums">
            {numericValue !== null ? (
               <AnimatedNumber value={numericValue} />
            ) : (
               // Non-integer values (e.g. "2h 15m") can't count up — slide the
               // old value out and the new one in on refetch instead.
               <AnimatePresence mode="wait" initial={false}>
                  <m.span
                     key={String(value)}
                     initial={
                        prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                     }
                     animate={
                        prefersReducedMotion
                           ? { opacity: 1 }
                           : { opacity: 1, y: 0 }
                     }
                     exit={
                        prefersReducedMotion
                           ? { opacity: 0 }
                           : { opacity: 0, y: -8 }
                     }
                     transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                     className="inline-block"
                  >
                     {value}
                  </m.span>
               </AnimatePresence>
            )}
         </p>
      </m.div>
   );
};
