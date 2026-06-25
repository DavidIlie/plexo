import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { env } from "~/env";
import { CACHE_TAGS } from "~/lib/cache-tags";
import type {
   PlexMediaContainer,
   PlexMediaItem,
   PlexLibrarySection,
   PlexOnDeckItem,
   PlexGenre,
} from "~/types/plex";

const plexFetch = async <T>(path: string): Promise<T> => {
   const url = new URL(path, env.PLEX_URL);
   const response = await fetch(url.toString(), {
      headers: {
         Accept: "application/json",
         "X-Plex-Token": env.PLEX_TOKEN,
      },
   });

   if (!response.ok) {
      throw new Error(`Plex API error: ${response.status} ${response.statusText}`);
   }

   return response.json() as Promise<T>;
};

export const getLibrarySections = async (): Promise<PlexLibrarySection[]> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.plexSections);

   const data =
      await plexFetch<PlexMediaContainer<PlexLibrarySection>>(
         "/library/sections",
      );
   const sections = data.MediaContainer.Directory;
   if (!sections) {
      throw new Error("Plex returned a malformed /library/sections response");
   }
   return sections;
};

const fetchSectionPage = async (
   sectionId: string,
   type: number,
   start: number,
   size: number,
) => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=${type}&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${size}`,
   );
   return {
      items: data.MediaContainer.Metadata ?? [],
      totalSize: data.MediaContainer.totalSize ?? 0,
   };
};

const fetchSectionTotal = async (sectionId: string, type: number) => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=${type}&X-Plex-Container-Start=0&X-Plex-Container-Size=1`,
   );
   return data.MediaContainer.totalSize ?? 0;
};

export const getMovies = async (
   sectionId: string,
   start = 0,
   size = 500,
): Promise<{ items: PlexMediaItem[]; totalSize: number }> => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));
   return fetchSectionPage(sectionId, 1, start, size);
};

export const getShows = async (
   sectionId: string,
   start = 0,
   size = 500,
): Promise<{ items: PlexMediaItem[]; totalSize: number }> => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));
   return fetchSectionPage(sectionId, 2, start, size);
};

export const getArtists = async (
   sectionId: string,
   start = 0,
   size = 500,
): Promise<{ items: PlexMediaItem[]; totalSize: number }> => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));
   return fetchSectionPage(sectionId, 8, start, size);
};

export const getAlbumCount = async (sectionId: string): Promise<number> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));
   return fetchSectionTotal(sectionId, 9);
};

export const getTrackCount = async (sectionId: string): Promise<number> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));
   return fetchSectionTotal(sectionId, 10);
};

export const getOnDeck = async (): Promise<PlexOnDeckItem[]> => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.plexOnDeck);

   const data =
      await plexFetch<PlexMediaContainer<PlexOnDeckItem>>("/library/onDeck");
   return data.MediaContainer.Metadata ?? [];
};

export const getRecentlyAdded = async (
   sectionId: string,
   count = 20,
): Promise<PlexMediaItem[]> => {
   "use cache";
   cacheLife("activity");
   cacheTag(
      CACHE_TAGS.plex,
      CACHE_TAGS.plexRecentlyAdded,
      CACHE_TAGS.section(sectionId),
   );

   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/recentlyAdded?X-Plex-Container-Size=${count}`,
   );
   return data.MediaContainer.Metadata ?? [];
};

export const getMetadata = async (ratingKey: string): Promise<PlexMediaItem | null> => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.plexItem(ratingKey));

   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/metadata/${ratingKey}`,
   );
   return data.MediaContainer.Metadata?.[0] ?? null;
};

export const getChildren = async (ratingKey: string): Promise<PlexMediaItem[]> => {
   "use cache";
   cacheLife("metadata");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.plexItem(ratingKey));

   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/metadata/${ratingKey}/children`,
   );
   return data.MediaContainer.Metadata ?? [];
};

export const getWatchlist = async (): Promise<PlexMediaItem[]> => {
   try {
      const data = await fetch(
         `https://metadata.provider.plex.tv/library/sections/watchlist/all?X-Plex-Token=${env.PLEX_TOKEN}`,
         { headers: { Accept: "application/json" } },
      );
      if (!data.ok) return [];
      const json = (await data.json()) as PlexMediaContainer<PlexMediaItem>;
      return json.MediaContainer.Metadata ?? [];
   } catch {
      return [];
   }
};

export const getSectionTotalSize = async (
   sectionId: string,
   type: number,
): Promise<number> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));

   let totalSize = 0;
   let start = 0;
   const batchSize = 500;
   while (true) {
      const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
         `/library/sections/${sectionId}/all?type=${type}&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${batchSize}`,
      );
      const items = data.MediaContainer.Metadata ?? [];
      for (const item of items) {
         const part = item.Media?.[0]?.Part?.[0];
         if (part?.size) totalSize += part.size;
      }
      if (items.length < batchSize) break;
      start += batchSize;
   }
   return totalSize;
};

export const getSectionItems = async (
   sectionId: string,
   type: number,
   size = 500,
): Promise<PlexMediaItem[]> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.section(sectionId));

   const items: PlexMediaItem[] = [];
   let start = 0;
   while (true) {
      const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
         `/library/sections/${sectionId}/all?type=${type}&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${size}`,
      );
      const batch = data.MediaContainer.Metadata ?? [];
      items.push(...batch);
      if (batch.length < size) break;
      start += size;
   }
   return items;
};

export const getGenres = async (sectionId: string): Promise<PlexGenre[]> => {
   "use cache";
   cacheLife("library");
   cacheTag(CACHE_TAGS.plex, CACHE_TAGS.genres(sectionId));

   const data = await plexFetch<PlexMediaContainer<PlexGenre>>(
      `/library/sections/${sectionId}/genre`,
   );
   return data.MediaContainer.Directory ?? [];
};
