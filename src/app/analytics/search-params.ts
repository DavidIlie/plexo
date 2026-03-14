import { parseAsString, createSearchParamsCache } from "nuqs/server";

export type Period = "last7d" | "last30d" | "mtd" | "last90d" | "last365d";

export const PERIODS: Array<{ value: Period; label: string; days: number | "mtd" }> = [
   { value: "last7d", label: "Last 7 days", days: 7 },
   { value: "last30d", label: "Last 30 days", days: 30 },
   { value: "mtd", label: "Month to date", days: "mtd" },
   { value: "last90d", label: "Last 90 days", days: 90 },
   { value: "last365d", label: "Last year", days: 365 },
];

export const analyticsSearchParams = {
   period: parseAsString.withDefault("last30d"),
};

export const analyticsSearchParamsCache = createSearchParamsCache(
   analyticsSearchParams,
);

export const periodToDays = (period: string): number => {
   const found = PERIODS.find((p) => p.value === period);
   if (!found) return 30;
   if (found.days === "mtd") {
      const now = new Date();
      return now.getDate();
   }
   return found.days;
};
