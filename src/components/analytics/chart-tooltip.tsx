"use client";

import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

// Scorecard-style tooltip shell shared by every chart: a card with a bold
// header row and label/value rows beneath, replacing the default recharts
// contentStyle box.
export const ChartTooltipCard = ({
   header,
   children,
   className,
}: {
   header: ReactNode;
   children: ReactNode;
   className?: string;
}) => (
   <div
      className={cn(
         "pointer-events-none min-w-44 max-w-70 rounded-xl border bg-card p-3 text-sm shadow-xl",
         className,
      )}
   >
      <div className="mb-2 border-b pb-1.5">
         <p className="text-[13px] font-semibold text-foreground">{header}</p>
      </div>
      <div className="space-y-1.5">{children}</div>
   </div>
);

export const ChartTooltipRow = ({
   color,
   label,
   value,
   muted = false,
}: {
   color?: string;
   label: ReactNode;
   value: ReactNode;
   muted?: boolean;
}) => (
   <div className="flex items-center justify-between gap-4">
      <span className="flex min-w-0 items-center gap-1.5">
         {color && (
            <span
               aria-hidden
               className="h-2 w-2 shrink-0 rounded-[3px]"
               style={{ backgroundColor: color }}
            />
         )}
         <span
            className={cn(
               "truncate text-xs",
               muted ? "text-muted-foreground/80" : "text-muted-foreground",
            )}
         >
            {label}
         </span>
      </span>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
         {value}
      </span>
   </div>
);
