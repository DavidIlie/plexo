"use client";

import { motion } from "framer-motion";
import { Film, Tv, Eye, Clock, Music, Disc3, Library, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { Film, Tv, Eye, Clock, Music, Disc3, Library };

interface StatCardProps {
   icon: string;
   label: string;
   value: string | number;
   index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
   icon,
   label,
   value,
   index = 0,
}) => {
   const Icon = icons[icon] ?? Film;

   return (
      <motion.div
         initial={{ opacity: 0, y: 12 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: index * 0.05 }}
         className="rounded-lg border border-border/50 bg-card p-4 transition-colors hover:border-primary/20"
      >
         <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs">{label}</span>
         </div>
         <p className="mt-1 text-2xl font-semibold tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
         </p>
      </motion.div>
   );
};
