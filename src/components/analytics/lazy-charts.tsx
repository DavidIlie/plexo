"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useInView } from "framer-motion";

import { ChartFallback } from "~/components/skeletons";
import type { GenreDistributionChart } from "~/components/analytics/genre-distribution-chart";
import type { MusicGenreChart } from "~/components/analytics/music-genre-chart";
import type { TopArtistsChart } from "~/components/analytics/top-artists-chart";
import type { WatchTimeByHourChart } from "~/components/analytics/watch-time-by-hour-chart";
import type { TopGenresChart } from "~/components/analytics/top-genres-chart";
import type { DeviceChart } from "~/components/analytics/device-chart";
import type { VideoQualityChart } from "~/components/analytics/video-quality-chart";
import type { AudioFormatChart } from "~/components/analytics/audio-format-chart";
import type { LibrarySizeChart } from "~/components/analytics/library-size-chart";
import type { MusicAudioFormatChart } from "~/components/analytics/music-audio-format-chart";
import type { DossierTimelineChart } from "~/components/media/dossier-timeline-chart";

// recharts 3 is not tree-shakeable (its immer/redux store couples every chart
// type into one ~565 kB chunk), so the only real lever is keeping that chunk
// out of the first-load graph entirely: every recharts-based chart below is
// loaded via top-level next/dynamic (ssr: false) and only mounted once its
// card scrolls near the viewport. Data still arrives through RSC props — only
// the hydration JS is deferred. The height-matched ChartFallback prevents CLS.

const GenreDistributionChartImpl = dynamic(
   () =>
      import("~/components/analytics/genre-distribution-chart").then((mod) => ({
         default: mod.GenreDistributionChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const MusicGenreChartImpl = dynamic(
   () =>
      import("~/components/analytics/music-genre-chart").then((mod) => ({
         default: mod.MusicGenreChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const TopArtistsChartImpl = dynamic(
   () =>
      import("~/components/analytics/top-artists-chart").then((mod) => ({
         default: mod.TopArtistsChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const WatchTimeByHourChartImpl = dynamic(
   () =>
      import("~/components/analytics/watch-time-by-hour-chart").then((mod) => ({
         default: mod.WatchTimeByHourChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const TopGenresChartImpl = dynamic(
   () =>
      import("~/components/analytics/top-genres-chart").then((mod) => ({
         default: mod.TopGenresChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const DeviceChartImpl = dynamic(
   () =>
      import("~/components/analytics/device-chart").then((mod) => ({
         default: mod.DeviceChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const VideoQualityChartImpl = dynamic(
   () =>
      import("~/components/analytics/video-quality-chart").then((mod) => ({
         default: mod.VideoQualityChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const AudioFormatChartImpl = dynamic(
   () =>
      import("~/components/analytics/audio-format-chart").then((mod) => ({
         default: mod.AudioFormatChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const LibrarySizeChartImpl = dynamic(
   () =>
      import("~/components/analytics/library-size-chart").then((mod) => ({
         default: mod.LibrarySizeChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const MusicAudioFormatChartImpl = dynamic(
   () =>
      import("~/components/analytics/music-audio-format-chart").then((mod) => ({
         default: mod.MusicAudioFormatChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

const DossierTimelineChartImpl = dynamic(
   () =>
      import("~/components/media/dossier-timeline-chart").then((mod) => ({
         default: mod.DossierTimelineChart,
      })),
   { ssr: false, loading: () => <ChartFallback /> },
);

// Mount-when-near-viewport gate: renders the height-matched fallback until
// the card scrolls within 200px of the viewport, then mounts the dynamic
// chart (which triggers the recharts chunk download).
const DeferUntilVisible = ({ children }: { children: ReactNode }) => {
   const ref = useRef<HTMLDivElement>(null);
   const isInView = useInView(ref, { once: true, margin: "200px 0px" });
   return <div ref={ref}>{isInView ? children : <ChartFallback />}</div>;
};

export const GenreDistributionChartLazy = (
   props: ComponentProps<typeof GenreDistributionChart>,
) => (
   <DeferUntilVisible>
      <GenreDistributionChartImpl {...props} />
   </DeferUntilVisible>
);

export const MusicGenreChartLazy = (
   props: ComponentProps<typeof MusicGenreChart>,
) => (
   <DeferUntilVisible>
      <MusicGenreChartImpl {...props} />
   </DeferUntilVisible>
);

export const TopArtistsChartLazy = (
   props: ComponentProps<typeof TopArtistsChart>,
) => (
   <DeferUntilVisible>
      <TopArtistsChartImpl {...props} />
   </DeferUntilVisible>
);

export const WatchTimeByHourChartLazy = (
   props: ComponentProps<typeof WatchTimeByHourChart>,
) => (
   <DeferUntilVisible>
      <WatchTimeByHourChartImpl {...props} />
   </DeferUntilVisible>
);

export const TopGenresChartLazy = (
   props: ComponentProps<typeof TopGenresChart>,
) => (
   <DeferUntilVisible>
      <TopGenresChartImpl {...props} />
   </DeferUntilVisible>
);

export const DeviceChartLazy = (props: ComponentProps<typeof DeviceChart>) => (
   <DeferUntilVisible>
      <DeviceChartImpl {...props} />
   </DeferUntilVisible>
);

export const VideoQualityChartLazy = (
   props: ComponentProps<typeof VideoQualityChart>,
) => (
   <DeferUntilVisible>
      <VideoQualityChartImpl {...props} />
   </DeferUntilVisible>
);

export const AudioFormatChartLazy = (
   props: ComponentProps<typeof AudioFormatChart>,
) => (
   <DeferUntilVisible>
      <AudioFormatChartImpl {...props} />
   </DeferUntilVisible>
);

export const LibrarySizeChartLazy = (
   props: ComponentProps<typeof LibrarySizeChart>,
) => (
   <DeferUntilVisible>
      <LibrarySizeChartImpl {...props} />
   </DeferUntilVisible>
);

export const MusicAudioFormatChartLazy = (
   props: ComponentProps<typeof MusicAudioFormatChart>,
) => (
   <DeferUntilVisible>
      <MusicAudioFormatChartImpl {...props} />
   </DeferUntilVisible>
);

export const DossierTimelineChartLazy = (
   props: ComponentProps<typeof DossierTimelineChart>,
) => (
   <DeferUntilVisible>
      <DossierTimelineChartImpl {...props} />
   </DeferUntilVisible>
);
