import { connection } from "next/server";

import { getLibrarySections } from "~/lib/plex";
import { findSection, type PlexSectionType } from "~/lib/plex-sections";
import type { PlexMediaItem } from "~/types/plex";

interface LibraryShellProps<T extends PlexMediaItem> {
   type: PlexSectionType;
   emptyMessage: string;
   fetchPage: (
      sectionId: string,
   ) => Promise<{ items: T[]; totalSize: number }>;
   children: (props: {
      sectionId: string;
      initialItems: T[];
      totalSize: number;
   }) => React.ReactNode;
}

export async function LibraryShell<T extends PlexMediaItem>({
   type,
   emptyMessage,
   fetchPage,
   children,
}: LibraryShellProps<T>) {
   await connection();
   const sections = await getLibrarySections();
   const sectionId = findSection(sections, type)?.key;

   if (!sectionId) {
      return (
         <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      );
   }

   const { items, totalSize } = await fetchPage(sectionId);
   return children({ sectionId, initialItems: items, totalSize });
}
