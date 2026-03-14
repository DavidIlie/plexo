"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
   ArrowLeft,
   ChevronDown,
   ChevronRight,
   Clock,
   Headphones,
   HardDrive,
   Play,
} from "lucide-react";

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
import {
   HoverCard,
   HoverCardContent,
   HoverCardTrigger,
} from "~/components/ui/hover-card";
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

const formatFileSize = (bytes: number) => {
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
   if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
   return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatBitrate = (kbps: number) => {
   if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
   return `${kbps} kbps`;
};

const formatSampleRate = (hz: number) => {
   if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
   return `${hz} Hz`;
};

const fmtPlayDuration = (secs: number) => {
   const mins = Math.round(secs / 60);
   if (mins < 60) return `${mins}m`;
   return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const TrackAudioBadges = ({ track }: { track: PlexMediaItem }) => {
   const media = track.Media?.[0];
   const part = media?.Part?.[0];
   const stream = part?.Stream?.find((s) => s.streamType === 2);

   if (!media && !part) return null;

   const badges: string[] = [];
   const codec = (media?.audioCodec ?? stream?.codec)?.toUpperCase();
   if (codec) badges.push(codec);
   if (stream?.samplingRate) badges.push(formatSampleRate(stream.samplingRate));
   if (stream?.bitDepth) badges.push(`${stream.bitDepth}-bit`);
   if (media?.bitrate) badges.push(formatBitrate(media.bitrate));
   if (stream?.channels) {
      badges.push(stream.channels === 2 ? "Stereo" : `${stream.channels}ch`);
   }

   return (
      <div className="flex items-center gap-1">
         {badges.map((b) => (
            <span
               key={b}
               className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground"
            >
               {b}
            </span>
         ))}
         {part?.size && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
               <HardDrive className="h-2.5 w-2.5" />
               {formatFileSize(part.size)}
            </span>
         )}
      </div>
   );
};

const TrackPlayPopover = ({ ratingKey, viewCount }: { ratingKey: string; viewCount: number }) => {
   const trpc = useTRPC();
   const [open, setOpen] = useState(false);

   const { data } = useQuery({
      ...trpc.tautulli.getItemHistory.queryOptions({ ratingKey }),
      enabled: open,
   });

   const plays = data?.data ?? [];

   return (
      <HoverCard open={open} onOpenChange={setOpen} openDelay={200} closeDelay={100}>
         <HoverCardTrigger asChild>
            <button className="flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary">
               <Play className="h-2.5 w-2.5" />
               {viewCount}
            </button>
         </HoverCardTrigger>
         <HoverCardContent side="top" className="w-56 p-3">
            <p className="mb-2 text-xs font-medium">
               {viewCount} play{viewCount !== 1 ? "s" : ""}
            </p>
            {plays.length === 0 && open && (
               <p className="text-xs text-muted-foreground">Loading...</p>
            )}
            {plays.length > 0 && (
               <div className="space-y-1.5">
                  {plays.slice(0, 5).map((play) => (
                     <div key={play.row_id} className="text-[11px]">
                        <p className="text-muted-foreground">
                           {formatDistanceToNow(
                              new Date(play.stopped * 1000),
                              { addSuffix: true },
                           )}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground/70">
                           {play.play_duration > 0 && (
                              <span>{fmtPlayDuration(play.play_duration)}</span>
                           )}
                           {play.platform && <span>{play.platform}</span>}
                        </div>
                     </div>
                  ))}
                  {plays.length > 5 && (
                     <p className="text-[10px] text-muted-foreground">
                        +{plays.length - 5} more
                     </p>
                  )}
               </div>
            )}
         </HoverCardContent>
      </HoverCard>
   );
};

const AlbumQualityProfile = ({ tracks }: { tracks: PlexMediaItem[] }) => {
   const profile = useMemo(() => {
      const codecs = new Set<string>();
      let totalSize = 0;
      let minBitrate = Infinity;
      let maxBitrate = 0;
      let sampleRate = 0;
      let bitDepth = 0;

      for (const track of tracks) {
         const media = track.Media?.[0];
         const part = media?.Part?.[0];
         const stream = part?.Stream?.find((s) => s.streamType === 2);
         const codec = (media?.audioCodec ?? stream?.codec)?.toUpperCase();
         if (codec) codecs.add(codec);
         if (part?.size) totalSize += part.size;
         if (media?.bitrate) {
            minBitrate = Math.min(minBitrate, media.bitrate);
            maxBitrate = Math.max(maxBitrate, media.bitrate);
         }
         if (stream?.samplingRate && stream.samplingRate > sampleRate) {
            sampleRate = stream.samplingRate;
         }
         if (stream?.bitDepth && stream.bitDepth > bitDepth) {
            bitDepth = stream.bitDepth;
         }
      }

      if (codecs.size === 0) return null;

      return {
         codecs: Array.from(codecs),
         totalSize,
         bitrateRange:
            minBitrate !== Infinity
               ? minBitrate === maxBitrate
                  ? formatBitrate(maxBitrate)
                  : `${formatBitrate(minBitrate)}–${formatBitrate(maxBitrate)}`
               : null,
         sampleRate: sampleRate > 0 ? formatSampleRate(sampleRate) : null,
         bitDepth: bitDepth > 0 ? `${bitDepth}-bit` : null,
      };
   }, [tracks]);

   if (!profile) return null;

   return (
      <div className="flex flex-wrap items-center gap-1.5">
         {profile.codecs.map((c) => (
            <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
               {c}
            </span>
         ))}
         {profile.sampleRate && (
            <span className="text-[10px] text-muted-foreground">{profile.sampleRate}</span>
         )}
         {profile.bitDepth && (
            <span className="text-[10px] text-muted-foreground">{profile.bitDepth}</span>
         )}
         {profile.bitrateRange && (
            <span className="text-[10px] text-muted-foreground">{profile.bitrateRange}</span>
         )}
         {profile.totalSize > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
               <HardDrive className="h-2.5 w-2.5" />
               {formatFileSize(profile.totalSize)}
            </span>
         )}
      </div>
   );
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
               <Skeleton key={i} className="h-10 w-full" />
            ))}
         </div>
      );
   }

   const tracks = data?.data ?? [];

   return (
      <div className="border-t border-border/50">
         <div className="px-4 pt-2 pb-1">
            <AlbumQualityProfile tracks={tracks} />
         </div>
         <div className="px-4 pb-4">
            {tracks.map((track) => (
               <div
                  key={track.ratingKey}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/50"
               >
                  <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">
                     {track.index}
                  </span>
                  <div className="flex-1 min-w-0">
                     <p className="truncate">{track.title}</p>
                     <TrackAudioBadges track={track} />
                  </div>
                  {(track.viewCount ?? 0) > 0 && (
                     <TrackPlayPopover
                        ratingKey={track.ratingKey}
                        viewCount={track.viewCount!}
                     />
                  )}
                  {track.duration && (
                     <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(track.duration)}
                     </span>
                  )}
               </div>
            ))}
         </div>
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
            {(album.viewCount ?? 0) > 0 && (
               <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Headphones className="h-3.5 w-3.5" />
                  {album.viewCount}
               </span>
            )}
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

   const totalPlays = useMemo(() => {
      let count = 0;
      for (const album of albums) {
         count += album.viewCount ?? 0;
      }
      return count;
   }, [albums]);

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
               <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {albums.length > 0 && (
                     <span>{albums.length} albums</span>
                  )}
                  {totalPlays > 0 && (
                     <span className="flex items-center gap-1">
                        <Headphones className="h-3.5 w-3.5" />
                        {totalPlays} plays
                     </span>
                  )}
               </div>
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
