import "server-only";

import { env } from "~/env";
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
   const data =
      await plexFetch<PlexMediaContainer<PlexLibrarySection>>(
         "/library/sections",
      );
   return data.MediaContainer.Directory ?? [];
};

export const getMovies = async (
   sectionId: string,
   start = 0,
   size = 500,
): Promise<{ items: PlexMediaItem[]; totalSize: number }> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=1&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${size}`,
   );
   return {
      items: data.MediaContainer.Metadata ?? [],
      totalSize: data.MediaContainer.totalSize ?? 0,
   };
};

export const getShows = async (
   sectionId: string,
   start = 0,
   size = 500,
): Promise<{ items: PlexMediaItem[]; totalSize: number }> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=2&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${size}`,
   );
   return {
      items: data.MediaContainer.Metadata ?? [],
      totalSize: data.MediaContainer.totalSize ?? 0,
   };
};

export const getArtists = async (
   sectionId: string,
   start = 0,
   size = 500,
): Promise<{ items: PlexMediaItem[]; totalSize: number }> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=8&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${size}`,
   );
   return {
      items: data.MediaContainer.Metadata ?? [],
      totalSize: data.MediaContainer.totalSize ?? 0,
   };
};

export const getAlbumCount = async (sectionId: string): Promise<number> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=9&X-Plex-Container-Start=0&X-Plex-Container-Size=1`,
   );
   return data.MediaContainer.totalSize ?? 0;
};

export const getTrackCount = async (sectionId: string): Promise<number> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/all?type=10&X-Plex-Container-Start=0&X-Plex-Container-Size=1`,
   );
   return data.MediaContainer.totalSize ?? 0;
};

export const getOnDeck = async (): Promise<PlexOnDeckItem[]> => {
   const data =
      await plexFetch<PlexMediaContainer<PlexOnDeckItem>>("/library/onDeck");
   return data.MediaContainer.Metadata ?? [];
};

export const getRecentlyAdded = async (
   sectionId: string,
   count = 20,
): Promise<PlexMediaItem[]> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${sectionId}/recentlyAdded?X-Plex-Container-Size=${count}`,
   );
   return data.MediaContainer.Metadata ?? [];
};

export const getMetadata = async (ratingKey: string): Promise<PlexMediaItem | null> => {
   const data = await plexFetch<PlexMediaContainer<PlexMediaItem>>(
      `/library/metadata/${ratingKey}`,
   );
   return data.MediaContainer.Metadata?.[0] ?? null;
};

export const getChildren = async (ratingKey: string): Promise<PlexMediaItem[]> => {
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

export const getGenres = async (sectionId: string): Promise<PlexGenre[]> => {
   const data = await plexFetch<PlexMediaContainer<PlexGenre>>(
      `/library/sections/${sectionId}/genre`,
   );
   return data.MediaContainer.Directory ?? [];
};
