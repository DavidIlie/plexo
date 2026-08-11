"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CirclePause, CirclePlay, Radio } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { PlexImage } from "~/components/plex-image";
import {
   getPlatformMeta,
   PlatformBadge,
} from "~/components/media/platform-icon";
import { ViewerIdentity } from "~/components/viewer-identity";
import { formatPlexDuration } from "~/lib/duration";
import { cn } from "~/lib/utils";
import type { CurrentActivitySession } from "~/types/tautulli";

const titleCase = (value: string) =>
   value.replace(/\b\w/g, (character) => character.toUpperCase());

const codecLabel = (value: string) => {
   const normalized = value.toLowerCase();
   if (normalized === "eac3") return "E-AC-3";
   if (normalized === "ac3") return "AC-3";
   if (normalized === "h264") return "H.264";
   if (normalized === "hevc" || normalized === "h265") return "HEVC";
   return value.toUpperCase();
};

const resolutionLabel = (value: string) => {
   const normalized = value.toLowerCase();
   if (normalized === "4k" || normalized === "2160") return "4K";
   if (normalized === "sd") return "SD";
   if (/^\d+$/.test(normalized)) return `${normalized}p`;
   return value;
};

const formatBitrate = (kbps: number) => {
   if (kbps <= 0) return "";
   if (kbps < 1000) return `${Math.round(kbps)} Kbps`;
   const mbps = kbps / 1000;
   return `${mbps >= 10 ? mbps.toFixed(1) : mbps.toFixed(2)} Mbps`;
};

const streamContext = (session: CurrentActivitySession) => {
   if (session.mediaType === "episode") {
      const episode =
         session.parentMediaIndex > 0 && session.mediaIndex > 0
            ? `S${session.parentMediaIndex}E${session.mediaIndex}`
            : "Episode";
      return [session.grandparentTitle, episode].filter(Boolean).join(" · ");
   }
   if (session.mediaType === "track") {
      return [session.grandparentTitle, session.parentTitle]
         .filter(Boolean)
         .join(" · ");
   }
   return session.year > 0 ? String(session.year) : session.mediaType;
};

const sessionHref = (session: CurrentActivitySession) => {
   if (session.mediaType === "episode" && session.grandparentRatingKey !== "0") {
      return `/media/${session.grandparentRatingKey}`;
   }
   if (session.mediaType === "movie") return `/media/${session.ratingKey}`;
   if (session.mediaType === "track" && session.grandparentRatingKey !== "0") {
      return `/music/${session.grandparentRatingKey}`;
   }
   return null;
};

const mediaDetail = (session: CurrentActivitySession) => {
   const sourceResolution = resolutionLabel(session.sourceVideoResolution);
   const streamResolution = resolutionLabel(session.streamVideoResolution);
   const sourceCodec = codecLabel(session.sourceVideoCodec);
   const streamCodec = codecLabel(session.streamVideoCodec);
   const resolutionChanged =
      sourceResolution && streamResolution && sourceResolution !== streamResolution;
   const codecChanged = sourceCodec && streamCodec && sourceCodec !== streamCodec;
   const video = [
      resolutionChanged
         ? `${sourceResolution} → ${streamResolution}`
         : streamResolution || sourceResolution,
      codecChanged ? `${sourceCodec} → ${streamCodec}` : streamCodec || sourceCodec,
      session.streamVideoDynamicRange || session.sourceVideoDynamicRange,
   ]
      .filter(Boolean)
      .join(" · ");

   const sourceAudio = [
      codecLabel(session.sourceAudioCodec),
      session.sourceAudioChannels,
   ]
      .filter(Boolean)
      .join(" ");
   const streamAudio = [
      codecLabel(session.streamAudioCodec),
      session.streamAudioChannels,
   ]
      .filter(Boolean)
      .join(" ");
   const audio =
      sourceAudio && streamAudio && sourceAudio !== streamAudio
         ? `${sourceAudio} → ${streamAudio}`
         : streamAudio || sourceAudio;

   const network = [
      formatBitrate(session.bandwidthKbps),
      session.streamBitrateKbps > 0
         ? `${formatBitrate(session.streamBitrateKbps)} stream`
         : "",
   ]
      .filter(Boolean)
      .join(" · ");
   const subtitles = [
      codecLabel(session.subtitleCodec),
      session.subtitleLanguage,
      session.streamSubtitleDecision
         ? titleCase(session.streamSubtitleDecision)
         : "",
   ]
      .filter(Boolean)
      .join(" · ");
   const sourceParts: string[] = [];
   const container = session.streamContainer || session.sourceContainer;
   if (container) sourceParts.push(container.toUpperCase());
   if (session.qualityProfile) sourceParts.push(session.qualityProfile);
   if (session.sourceBitrateKbps > 0) {
      sourceParts.push(`${formatBitrate(session.sourceBitrateKbps)} source`);
   }
   const source = sourceParts.join(" · ");

   return [
      { label: "Video", value: video },
      { label: "Audio", value: audio },
      { label: "Subtitles", value: subtitles },
      { label: "Network", value: network },
      { label: "Profile", value: source },
   ].filter((entry) => entry.value);
};

const decisionClass = (decision: string) => {
   const normalized = decision.toLowerCase();
   if (normalized === "direct play") {
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
   }
   if (normalized.includes("transcode")) {
      return "border-primary/25 bg-primary/10 text-primary";
   }
   return "border-border/60 bg-muted/50 text-muted-foreground";
};

const StreamRow = ({
   session,
   priority = false,
}: {
   session: CurrentActivitySession;
   priority?: boolean;
}) => {
   const progress = Math.min(
      100,
      Math.max(
         0,
         session.progressPercent ||
            (session.durationMs > 0
               ? (session.viewOffsetMs / session.durationMs) * 100
               : 0),
      ),
   );
   const paused = session.state.toLowerCase() === "paused";
   const href = sessionHref(session);
   const details = mediaDetail(session);
   const poster =
      session.grandparentThumb || session.parentThumb || session.thumb;
   const decision = titleCase(session.transcodeDecision || "Unknown");

   return (
      <article className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-4">
         <PlexImage
            path={poster}
            alt=""
            width={144}
            height={216}
            priority={priority}
            className="aspect-[2/3] w-14 self-start rounded-md ring-1 ring-border/50 sm:w-[72px]"
         />

         <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
               <div className="min-w-0">
                  {href ? (
                     <Link
                        href={href}
                        className="block truncate text-sm font-medium transition-colors hover:text-primary"
                     >
                        {session.title}
                     </Link>
                  ) : (
                     <p className="truncate text-sm font-medium">{session.title}</p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                     {streamContext(session)}
                  </p>
               </div>

               <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
                     {paused ? (
                        <CirclePause className="h-3 w-3" />
                     ) : (
                        <CirclePlay className="h-3 w-3 text-emerald-500" />
                     )}
                     {paused ? "Paused" : titleCase(session.state || "Playing")}
                  </span>
                  <span
                     className={cn(
                        "rounded-full border px-2 py-0.5 font-medium",
                        decisionClass(session.transcodeDecision),
                     )}
                  >
                     {session.hardwareTranscode ? `HW ${decision}` : decision}
                  </span>
                  {session.transcodeThrottled && (
                     <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
                        Throttled
                     </span>
                  )}
               </div>
            </div>

            <div>
               <div
                  role="progressbar"
                  aria-label={`${Math.round(progress)}% watched`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  className="h-1 overflow-hidden rounded-full bg-secondary"
               >
                  <div
                     className="h-full origin-left rounded-full bg-primary transition-transform duration-700 motion-reduce:transition-none"
                     style={{ transform: `scaleX(${progress / 100})` }}
                  />
               </div>
               <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] tabular-nums text-muted-foreground">
                  <span>{formatPlexDuration(session.viewOffsetMs)}</span>
                  <span>
                     {Math.round(progress)}%
                     {session.durationMs > session.viewOffsetMs
                        ? ` · ${formatPlexDuration(
                             session.durationMs - session.viewOffsetMs,
                          )} left`
                        : ""}
                  </span>
               </div>
            </div>

            {(session.viewer || session.platform || session.player) && (
               <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  {session.viewer && (
                     <ViewerIdentity viewer={session.viewer} />
                  )}
                  {session.viewer && (session.platform || session.player) && (
                     <span aria-hidden className="text-border">
                        ·
                     </span>
                  )}
                  {session.platform && (
                     <PlatformBadge platform={session.platform} />
                  )}
                  {session.player &&
                     session.player.toLowerCase() !==
                        getPlatformMeta(
                           session.platform ?? "",
                        ).label.toLowerCase() && (
                     <>
                        <span aria-hidden className="text-border">
                           ·
                        </span>
                        <span>{session.player}</span>
                     </>
                  )}
               </div>
            )}

            {details.length > 0 && (
               <dl className="grid gap-x-5 gap-y-2 border-t border-border/40 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  {details.map((detail) => (
                     <div key={detail.label} className="min-w-0">
                        <dt className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/65">
                           {detail.label}
                        </dt>
                        <dd className="mt-0.5 truncate text-[11px] text-muted-foreground">
                           {detail.value}
                        </dd>
                     </div>
                  ))}
               </dl>
            )}
         </div>
      </article>
   );
};

export const NowWatching = () => {
   const trpc = useTRPC();
   const { data } = useQuery({
      ...trpc.tautulli.getActivity.queryOptions(),
      staleTime: 0,
      refetchInterval: 10_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      retry: 1,
   });
   const activity = data?.data;

   if (!activity || activity.sessions.length === 0) return null;

   return (
      <section aria-labelledby="now-watching-heading">
         <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-2">
               <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
               </span>
               <h2
                  id="now-watching-heading"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
               >
                  Now watching
               </h2>
            </div>
            <p
               aria-live="polite"
               className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70"
            >
               <Radio className="h-3 w-3" />
               {activity.streamCount} active stream
               {activity.streamCount === 1 ? "" : "s"}
               {activity.totalBandwidthKbps > 0
                  ? ` · ${formatBitrate(activity.totalBandwidthKbps)} total`
                  : ""}
            </p>
         </div>

         <div className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card/45 px-4 py-4 sm:px-5">
            {activity.sessions.map((session, index) => (
               <StreamRow
                  key={session.sessionKey}
                  session={session}
                  priority={index === 0}
               />
            ))}
         </div>
      </section>
   );
};
