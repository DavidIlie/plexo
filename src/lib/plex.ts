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

export const getGenres = async (sectionId: string): Promise<PlexGenre[]> => {
   const data = await plexFetch<PlexMediaContainer<PlexGenre>>(
      `/library/sections/${sectionId}/genre`,
   );
   return data.MediaContainer.Directory ?? [];
};
