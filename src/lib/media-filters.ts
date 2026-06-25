import type { PlexMediaItem } from "~/types/plex";

export const extractGenres = (items: PlexMediaItem[]): string[] => {
   const genreSet = new Set<string>();
   for (const item of items) {
      if (item.Genre) {
         for (const g of item.Genre) genreSet.add(g.tag);
      }
   }
   return Array.from(genreSet).sort();
};

export const matchesSearch = (title: string, query: string): boolean =>
   !query || title.toLowerCase().includes(query.toLowerCase());
