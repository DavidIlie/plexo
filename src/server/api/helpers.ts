import { z } from "zod";

import type { PlexMediaItem } from "~/types/plex";

export const stamp = <T>(data: T) => ({
   data,
   lastUpdatedAt: new Date().toISOString(),
});

export const browseInput = z.object({
   sectionId: z.string(),
   cursor: z.number().nullish(),
   limit: z.number().default(60),
});

export const paginateSection = (
   start: number,
   limit: number,
   data: { items: PlexMediaItem[]; totalSize: number },
) => ({
   items: data.items,
   totalSize: data.totalSize,
   nextCursor:
      start + limit < data.totalSize ? start + limit : undefined,
});
