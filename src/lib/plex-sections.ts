import type { PlexLibrarySection } from "~/types/plex";

export type PlexSectionType = "movie" | "show" | "artist";

export const findSection = (
   sections: PlexLibrarySection[],
   type: PlexSectionType,
) => sections.find((s) => s.type === type);
