"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronRight, Clock } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { PlexImage } from "~/components/plex-image";
import { Skeleton } from "~/components/ui/skeleton";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "~/components/ui/dialog";
import type { PlexMediaItem } from "~/types/plex";

const SUMMARY_LIMIT = 300;

const ArtistSummary = ({ text, artistName }: { text: string; artistName: string }) => {
   const [open, setOpen] = useState(false);
   const needsTruncation = text.length > SUMMARY_LIMIT;
   const preview = needsTruncation
      ? text.slice(0, SUMMARY_LIMIT).trimEnd() + "..."
      : text;

   return (
      <>
         <p className="text-sm leading-relaxed text-muted-foreground">
            {preview}
            {needsTruncation && (
               <>
                  {" "}
                  <button
                     onClick={() => setOpen(true)}
                     className="text-primary hover:underline"
                  >
                     Read more
                  </button>
               </>
            )}
         </p>
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
               <DialogHeader>
                  <DialogTitle>About {artistName}</DialogTitle>
                  <DialogDescription className="sr-only">
                     Biography of {artistName}
                  </DialogDescription>
               </DialogHeader>
               <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {text}
               </p>
            </DialogContent>
         </Dialog>
      </>
   );
};

const formatDuration = (ms: number) => {
   const minutes = Math.floor(ms / 60000);
   const seconds = Math.floor((ms % 60000) / 1000);
   return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const AlbumTracks = ({ albumKey }: { albumKey: string }) => {
   const trpc = useTRPC();
   const { data, isLoading } = useQuery(
      trpc.plex.getChildren.queryOptions({ ratingKey: albumKey }),
   );

   if (isLoading) {
      return (
         <div className="space-y-2 px-4 pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <Skeleton key={i} className="h-8 w-full" />
            ))}
         </div>
      );
   }

   const tracks = data?.data ?? [];

   return (
      <div className="border-t border-border/50 px-4 pb-4 pt-2">
         {tracks.map((track) => (
            <div
               key={track.ratingKey}
               className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
               <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">
                  {track.index}
               </span>
               <span className="flex-1 truncate">{track.title}</span>
               {track.duration && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                     <Clock className="h-3 w-3" />
                     {formatDuration(track.duration)}
                  </span>
               )}
            </div>
         ))}
      </div>
   );
};

const AlbumCard = ({ album }: { album: PlexMediaItem }) => {
   const [expanded, setExpanded] = useState(false);

   return (
      <div className="rounded-lg border border-border/50 bg-card">
         <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30"
         >
            <PlexImage
               path={album.thumb}
               alt={album.title}
               width={80}
               height={80}
               className="h-16 w-16 rounded-md object-cover"
            />
            <div className="flex-1 min-w-0">
               <p className="truncate font-medium">{album.title}</p>
               <p className="text-sm text-muted-foreground">
                  {[album.year, album.leafCount ? `${album.leafCount} tracks` : null]
                     .filter(Boolean)
                     .join(" · ")}
               </p>
            </div>
            {expanded ? (
               <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
               <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
         </button>
         {expanded && <AlbumTracks albumKey={album.ratingKey} />}
      </div>
   );
};

export const ArtistDetail = ({ ratingKey }: { ratingKey: string }) => {
   const trpc = useTRPC();

   const { data: artistData } = useQuery(
      trpc.plex.getMetadata.queryOptions({ ratingKey }),
   );
   const { data: albumsData, isLoading: albumsLoading } = useQuery(
      trpc.plex.getChildren.queryOptions({ ratingKey }),
   );

   const artist = artistData?.data;
   const albums = albumsData?.data ?? [];

   if (!artist) return null;

   return (
      <div className="space-y-6">
         <Link
            href="/music"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
         >
            <ArrowLeft className="h-4 w-4" />
            Back to Music
         </Link>

         <div className="flex flex-col gap-6 sm:flex-row">
            <PlexImage
               path={artist.thumb}
               alt={artist.title}
               width={300}
               height={300}
               className="h-48 w-48 shrink-0 rounded-lg object-cover"
            />
            <div className="space-y-3">
               <h1 className="text-2xl font-bold">{artist.title}</h1>
               {artist.Genre && artist.Genre.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                     {artist.Genre.map((g) => (
                        <span
                           key={g.tag}
                           className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                           {g.tag}
                        </span>
                     ))}
                  </div>
               )}
               {artist.summary && (
                  <ArtistSummary text={artist.summary} artistName={artist.title} />
               )}
            </div>
         </div>

         <div className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
               Albums ({albums.length})
            </h2>
            {albumsLoading ? (
               <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                     <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
               </div>
            ) : (
               <div className="space-y-2">
                  {albums.map((album) => (
                     <AlbumCard key={album.ratingKey} album={album} />
                  ))}
               </div>
            )}
         </div>
      </div>
   );
};
