"use client";

import { useQueryState, parseAsString } from "nuqs";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "~/components/ui/select";
import { PERIODS } from "~/app/analytics/search-params";

export const PeriodSelector = () => {
   const [period, setPeriod] = useQueryState(
      "period",
      parseAsString.withDefault("last30d"),
   );

   return (
      <Select value={period} onValueChange={setPeriod}>
         <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
         </SelectTrigger>
         <SelectContent>
            {PERIODS.map((p) => (
               <SelectItem key={p.value} value={p.value} className="text-xs">
                  {p.label}
               </SelectItem>
            ))}
         </SelectContent>
      </Select>
   );
};

export const usePeriodDays = (): number => {
   const [period] = useQueryState(
      "period",
      parseAsString.withDefault("last30d"),
   );
   const found = PERIODS.find((p) => p.value === period);
   if (!found) return 30;
   if (found.days === "mtd") {
      return new Date().getDate();
   }
   return found.days;
};
