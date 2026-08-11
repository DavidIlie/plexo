"use client";

import { useTransition } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import {
   ALL_TIME_PERIOD,
   PERIODS,
   navigatePeriod,
   formatPeriodLabel,
   canGoForward,
} from "~/app/analytics/search-params";

export const PeriodSelector = () => {
   const [isPending, startTransition] = useTransition();
   const [period, setPeriod] = useQueryState(
      "period",
      parseAsString.withDefault("last30d").withOptions({
         history: "push",
         shallow: false,
         startTransition,
      }),
   );

   const isCustom = period.startsWith("custom:");
   const label = formatPeriodLabel(period);
   const forward = canGoForward(period);

   const handleNavigate = (direction: -1 | 1) => {
      const next = navigatePeriod(period, direction);
      void setPeriod(next);
   };

   const handlePresetChange = (value: string) => {
      void setPeriod(value);
   };

   return (
      <div
         className="flex items-center gap-1 rounded-md border border-border/50 bg-card p-0.5 transition-opacity data-[pending=true]:opacity-70"
         data-pending={isPending}
         aria-busy={isPending}
      >
         <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm"
            aria-label="Previous analytics period"
            onClick={() => handleNavigate(-1)}
            disabled={period === ALL_TIME_PERIOD}
         >
            <ChevronLeft className="h-3.5 w-3.5" />
         </Button>

         <Select
            value={isCustom ? "__custom__" : period}
            onValueChange={handlePresetChange}
         >
            <SelectTrigger
               className="h-7 w-auto min-w-[120px] gap-1 border-0 bg-transparent px-2 text-xs shadow-none focus:ring-0"
               aria-label="Analytics period"
            >
               <SelectValue>{label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
               {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                     {p.label}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>

         <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm"
            aria-label="Next analytics period"
            onClick={() => handleNavigate(1)}
            disabled={!forward}
         >
            <ChevronRight className="h-3.5 w-3.5" />
         </Button>
      </div>
   );
};
