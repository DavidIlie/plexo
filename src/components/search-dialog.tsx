"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Film, Tv, Music, X } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { useAppConfig } from "~/components/app-config-provider";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { PlexImage } from "~/components/plex-image";
import { MediaDetailDialog } from "~/components/media/media-detail-dialog";
import { useDebounce } from "~/hooks/use-debounce";
import type { PlexMediaItem } from "~/types/plex";

type TypeFilter = "all" | "movie" | "show" | "artist";

export const SearchDialog = () => {
   const trpc = useTRPC();
   const router = useRouter();
   const { musicEnabled } = useAppConfig();
   const [open, setOpen] = useState(false);
   const [query, setQuery] = useState("");
   const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
   const [genreFilter, setGenreFilter] = useState<string | null>(null);
   const [directorFilter, setDirectorFilter] = useState<string | null>(null);
   const [selectedItem, setSelectedItem] = useState<PlexMediaItem | null>(null);
   const debouncedQuery = useDebounce(query, 200);

   useEffect(() => {
      const handler = (e: KeyboardEvent) => {
         if (
            e.key === "k" &&
            !e.metaKey &&
            !e.ctrlKey &&
            !(e.target instanceof HTMLInputElement) &&
            !(e.target instanceof HTMLTextAreaElement)
         ) {
            e.preventDefault();
            setOpen(true);
         }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
   }, []);

   const resetFilters = useCallback(() => {
      setQuery("");
      setTypeFilter("all");
      setGenreFilter(null);
      setDirectorFilter(null);
   }, []);

   const { data: sections } = useQuery(
      trpc.plex.getLibrarySections.queryOptions(),
   );
   const movieSectionId = sections?.data.find(
      (s) => s.type === "movie",
   )?.key;
   const showSectionId = sections?.data.find((s) => s.type === "show")?.key;
   const musicSectionId = sections?.data.find(
      (s) => s.type === "artist",
   )?.key;

   const { data: moviesData } = useQuery({
      ...trpc.plex.getMovies.queryOptions({
         sectionId: movieSectionId ?? "1",
      }),
      enabled: open && !!movieSectionId,
   });

   const { data: showsData } = useQuery({
      ...trpc.plex.getShows.queryOptions({
         sectionId: showSectionId ?? "2",
      }),
      enabled: open && !!showSectionId,
   });

   const { data: artistsData } = useQuery({
      ...trpc.plex.getArtists.queryOptions({
         sectionId: musicSectionId ?? "1",
      }),
      enabled: open && musicEnabled && !!musicSectionId,
   });

   const allItems = useMemo(() => {
      const movies = moviesData?.data.items ?? [];
      const shows = showsData?.data.items ?? [];
      const artists = musicEnabled
         ? (artistsData?.data.items ?? []).filter((a) => a.thumb)
         : [];
      return [...movies, ...shows, ...artists];
   }, [moviesData, showsData, artistsData, musicEnabled]);

   const allGenres = useMemo(() => {
      const genreSet = new Set<string>();
      for (const item of allItems) {
         for (const g of item.Genre ?? []) genreSet.add(g.tag);
      }
      return Array.from(genreSet).sort();
   }, [allItems]);

   const allDirectors = useMemo(() => {
      const dirSet = new Set<string>();
      for (const item of allItems) {
         if (item.type === "artist") continue;
         for (const d of item.Director ?? []) dirSet.add(d.tag);
      }
      return Array.from(dirSet).sort();
   }, [allItems]);

   const filtered = useMemo(() => {
      return allItems
         .filter((item) => {
            if (typeFilter === "movie" && item.type !== "movie") return false;
            if (typeFilter === "show" && item.type !== "show") return false;
            if (typeFilter === "artist" && item.type !== "artist") return false;
            if (
               genreFilter &&
               !item.Genre?.some((g) => g.tag === genreFilter)
            )
               return false;
            if (
               directorFilter &&
               !item.Director?.some((d) => d.tag === directorFilter)
            )
               return false;
            if (
               debouncedQuery &&
               !item.title
                  .toLowerCase()
                  .includes(debouncedQuery.toLowerCase())
            )
               return false;
            return true;
         })
         .slice(0, 50);
   }, [allItems, typeFilter, genreFilter, directorFilter, debouncedQuery]);

   const hasActiveFilters =
      typeFilter !== "all" || !!genreFilter || !!directorFilter;

   const typeFilters: Array<{ value: TypeFilter; label: string }> = [
      { value: "all", label: "All" },
      { value: "movie", label: "Movies" },
      { value: "show", label: "TV" },
   ];
   if (musicEnabled) {
      typeFilters.push({ value: "artist", label: "Music" });
   }

   const handleItemClick = (item: PlexMediaItem) => {
      if (item.type === "artist") {
         setOpen(false);
         resetFilters();
         router.push(`/music/${item.ratingKey}`);
      } else {
         setSelectedItem(item);
         setOpen(false);
      }
   };

   const getItemIcon = (type: string) => {
      if (type === "artist")
         return <Music className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
      if (type === "show")
         return <Tv className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
      return <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
   };

   const getItemSubtitle = (item: PlexMediaItem) => {
      const parts: string[] = [];
      if (item.year) parts.push(String(item.year));
      if (item.type === "artist" && item.childCount) {
         parts.push(`${item.childCount} albums`);
      }
      if (item.Genre?.[0]) parts.push(item.Genre[0].tag);
      if (item.Director?.[0]) parts.push(item.Director[0].tag);
      return parts.join(" · ");
   };

   return (
      <>
         <Dialog
            open={open}
            onOpenChange={(v) => {
               setOpen(v);
               if (!v) resetFilters();
            }}
         >
            <DialogContent className="max-h-[80vh] overflow-hidden p-0 outline-none sm:max-w-xl">
               <DialogHeader className="sr-only">
                  <DialogTitle>Search</DialogTitle>
               </DialogHeader>

               <div className="flex items-center border-b border-border px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder={
                        musicEnabled
                           ? "Search movies, TV shows, and artists..."
                           : "Search movies and TV shows..."
                     }
                     className="border-0 shadow-none outline-none focus-visible:ring-0 focus-visible:outline-none"
                     autoFocus
                  />
                  {query && (
                     <button
                        onClick={() => setQuery("")}
                        className="text-muted-foreground hover:text-foreground"
                     >
                        <X className="h-3.5 w-3.5" />
                     </button>
                  )}
               </div>

               <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
                  {typeFilters.map((t) => (
                     <button
                        key={t.value}
                        onClick={() => setTypeFilter(t.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                           typeFilter === t.value
                              ? "bg-foreground/10 text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                        }`}
                     >
                        {t.label}
                     </button>
                  ))}

                  {genreFilter && (
                     <Badge variant="secondary" className="gap-1 text-xs">
                        {genreFilter}
                        <button onClick={() => setGenreFilter(null)}>
                           <X className="h-2.5 w-2.5" />
                        </button>
                     </Badge>
                  )}
                  {directorFilter && (
                     <Badge variant="secondary" className="gap-1 text-xs">
                        Dir: {directorFilter}
                        <button onClick={() => setDirectorFilter(null)}>
                           <X className="h-2.5 w-2.5" />
                        </button>
                     </Badge>
                  )}
                  {hasActiveFilters && (
                     <button
                        onClick={resetFilters}
                        className="text-xs text-muted-foreground hover:text-foreground"
                     >
                        Clear
                     </button>
                  )}
               </div>

               {!debouncedQuery && !hasActiveFilters && (
                  <div className="space-y-3 px-4 py-3">
                     <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">
                           Genres
                        </p>
                        <div className="flex flex-wrap gap-1">
                           {allGenres.slice(0, 15).map((g) => (
                              <button
                                 key={g}
                                 onClick={() => setGenreFilter(g)}
                                 className="rounded-full border border-border/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                              >
                                 {g}
                              </button>
                           ))}
                        </div>
                     </div>
                     {allDirectors.length > 0 && (
                        <div>
                           <p className="mb-1.5 text-xs text-muted-foreground">
                              Directors
                           </p>
                           <div className="flex flex-wrap gap-1">
                              {allDirectors.slice(0, 12).map((d) => (
                                 <button
                                    key={d}
                                    onClick={() => setDirectorFilter(d)}
                                    className="rounded-full border border-border/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                                 >
                                    {d}
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {(debouncedQuery || hasActiveFilters) && (
                  <div className="max-h-[50vh] overflow-y-auto px-2 py-1">
                     {filtered.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                           No results
                        </p>
                     )}
                     {filtered.map((item) => (
                        <button
                           key={item.ratingKey}
                           onClick={() => handleItemClick(item)}
                           className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                        >
                           <PlexImage
                              path={item.thumb}
                              alt={item.title}
                              width={32}
                              height={48}
                              className="shrink-0 rounded object-cover"
                           />
                           <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                 {getItemSubtitle(item)}
                              </p>
                           </div>
                           {getItemIcon(item.type)}
                        </button>
                     ))}
                     {filtered.length > 0 && (
                        <p className="py-2 text-center text-xs text-muted-foreground">
                           {filtered.length} result
                           {filtered.length !== 1 ? "s" : ""}
                        </p>
                     )}
                  </div>
               )}
            </DialogContent>
         </Dialog>

         <MediaDetailDialog
            item={selectedItem}
            open={!!selectedItem}
            onOpenChange={(v) => {
               if (!v) setSelectedItem(null);
            }}
         />
      </>
   );
};
