export const getResolutionCategory = (res: string | undefined): string => {
   if (!res) return "unknown";
   if (res === "4k" || res === "2160") return "4k";
   if (res === "1080") return "1080p";
   if (res === "720") return "720p";
   return "sd";
};

export const RESOLUTION_LABELS: Record<string, string> = {
   "4k": "4K",
   "2160": "4K",
   "1080": "1080p",
   "720": "720p",
   sd: "SD",
};
