"use client";

import { motion, useReducedMotion } from "framer-motion";
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
      <motion.div
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
         <p className="mt-1 text-2xl font-semibold tabular-nums">
            {numericValue !== null ? (
               <AnimatedNumber value={numericValue} />
            ) : (
               value
            )}
         </p>
      </motion.div>
   );
};
