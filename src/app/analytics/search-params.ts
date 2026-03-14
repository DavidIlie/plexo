import { parseAsString, createSearchParamsCache } from "nuqs/server";
import {
   subDays,
   startOfMonth,
   subMonths,
   endOfMonth,
   differenceInDays,
   addDays,
   format,
   isAfter,
   startOfDay,
} from "date-fns";

export type Period = "last7d" | "last30d" | "mtd" | "last90d" | "last365d" | string;

export const PERIODS: Array<{ value: string; label: string }> = [
   { value: "last7d", label: "Last 7 days" },
   { value: "last30d", label: "Last 30 days" },
   { value: "mtd", label: "Month to date" },
   { value: "last90d", label: "Last 90 days" },
   { value: "last365d", label: "Last year" },
];

export const analyticsSearchParams = {
   period: parseAsString.withDefault("last30d"),
};

export const analyticsSearchParamsCache = createSearchParamsCache(
   analyticsSearchParams,
);

export const periodToDateRange = (
   period: string,
): { start: Date; end: Date; days: number } => {
   const now = new Date();
   const today = startOfDay(now);

   if (period.startsWith("custom:")) {
      const parts = period.split(":");
      const start = new Date(parts[1]);
      const end = new Date(parts[2]);
      return { start, end, days: differenceInDays(end, start) + 1 };
   }

   switch (period) {
      case "last7d":
         return { start: subDays(today, 7), end: today, days: 7 };
      case "last30d":
         return { start: subDays(today, 30), end: today, days: 30 };
      case "mtd":
         return {
            start: startOfMonth(today),
            end: today,
            days: today.getDate(),
         };
      case "last90d":
         return { start: subDays(today, 90), end: today, days: 90 };
      case "last365d":
         return { start: subDays(today, 365), end: today, days: 365 };
      default:
         return { start: subDays(today, 30), end: today, days: 30 };
   }
};

export const periodToDays = (period: string): number => {
   return periodToDateRange(period).days;
};

export const navigatePeriod = (
   currentPeriod: string,
   direction: -1 | 1,
): string => {
   const now = new Date();
   const today = startOfDay(now);

   if (currentPeriod.startsWith("custom:")) {
      const parts = currentPeriod.split(":");
      const start = new Date(parts[1]);
      const end = new Date(parts[2]);
      const duration = differenceInDays(end, start) + 1;
      const shift = duration * direction;
      const newStart = addDays(start, shift);
      const newEnd = addDays(end, shift);
      if (direction === 1 && isAfter(newEnd, today)) return currentPeriod;
      return `custom:${format(newStart, "yyyy-MM-dd")}:${format(newEnd, "yyyy-MM-dd")}`;
   }

   switch (currentPeriod) {
      case "last7d": {
         const { start, end } = periodToDateRange("last7d");
         const newStart = addDays(start, 7 * direction);
         const newEnd = addDays(end, 7 * direction);
         if (direction === 1 && isAfter(newEnd, today)) return "last7d";
         return `custom:${format(newStart, "yyyy-MM-dd")}:${format(newEnd, "yyyy-MM-dd")}`;
      }
      case "last30d": {
         const { start, end } = periodToDateRange("last30d");
         const newStart = addDays(start, 30 * direction);
         const newEnd = addDays(end, 30 * direction);
         if (direction === 1 && isAfter(newEnd, today)) return "last30d";
         return `custom:${format(newStart, "yyyy-MM-dd")}:${format(newEnd, "yyyy-MM-dd")}`;
      }
      case "mtd": {
         const target = direction === -1 ? subMonths(today, 1) : today;
         const monthStart = startOfMonth(target);
         const monthEnd =
            direction === -1 ? endOfMonth(target) : today;
         if (direction === 1) return "mtd";
         return `custom:${format(monthStart, "yyyy-MM-dd")}:${format(monthEnd, "yyyy-MM-dd")}`;
      }
      case "last90d": {
         const { start, end } = periodToDateRange("last90d");
         const newStart = addDays(start, 90 * direction);
         const newEnd = addDays(end, 90 * direction);
         if (direction === 1 && isAfter(newEnd, today)) return "last90d";
         return `custom:${format(newStart, "yyyy-MM-dd")}:${format(newEnd, "yyyy-MM-dd")}`;
      }
      case "last365d": {
         const { start, end } = periodToDateRange("last365d");
         const newStart = addDays(start, 365 * direction);
         const newEnd = addDays(end, 365 * direction);
         if (direction === 1 && isAfter(newEnd, today)) return "last365d";
         return `custom:${format(newStart, "yyyy-MM-dd")}:${format(newEnd, "yyyy-MM-dd")}`;
      }
      default:
         return currentPeriod;
   }
};

export const formatPeriodLabel = (period: string): string => {
   const preset = PERIODS.find((p) => p.value === period);
   if (preset) return preset.label;

   if (period.startsWith("custom:")) {
      const parts = period.split(":");
      const start = new Date(parts[1]);
      const end = new Date(parts[2]);
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
   }

   return "Last 30 days";
};

export const canGoForward = (period: string): boolean => {
   const { end } = periodToDateRange(period);
   const today = startOfDay(new Date());
   return !isAfter(end, subDays(today, 1));
};
