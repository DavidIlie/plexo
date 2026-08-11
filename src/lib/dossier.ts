import {
   addDays,
   addMonths,
   eachDayOfInterval,
   eachMonthOfInterval,
   format,
   startOfDay,
   startOfMonth,
} from "date-fns";

import type {
   DossierBucket,
   DossierBucketUnit,
   DossierEpisodeStat,
   DossierPlatform,
   MediaDossier,
} from "~/types/dossier";
import type { ActivityHistoryItem } from "~/types/tautulli";

const DAY_BUCKET_MAX_SPAN_DAYS = 60;
const MIN_BUCKETS = 5;
const PLAY_LOG_LIMIT = 60;
const TOP_PLATFORMS = 5;

/**
 * Tautulli leaves `stopped` at 0 for a session that never ended cleanly, so
 * fall back through `started` to the row's own day stamp.
 */
export const playTimestamp = (row: ActivityHistoryItem): number =>
   row.stopped || row.started || row.date;

const emptyDossier = (): MediaDossier => ({
   totalPlays: 0,
   totalSeconds: 0,
   firstWatchedAt: null,
   lastWatchedAt: null,
   completedPlays: 0,
   distinctEpisodes: 0,
   distinctViewers: 0,
   bucketUnit: "day",
   buckets: [],
   episodes: [],
   platforms: [],
   plays: [],
   playsTruncated: false,
});

const bucketAxis = (
   firstMs: number,
   lastMs: number,
   unit: DossierBucketUnit,
): Date[] => {
   if (unit === "day") {
      let start = startOfDay(new Date(firstMs));
      const end = startOfDay(new Date(lastMs));
      const span = eachDayOfInterval({ start, end }).length;
      if (span < MIN_BUCKETS) start = addDays(start, span - MIN_BUCKETS);
      return eachDayOfInterval({ start, end });
   }

   let start = startOfMonth(new Date(firstMs));
   const end = startOfMonth(new Date(lastMs));
   const span = eachMonthOfInterval({ start, end }).length;
   if (span < MIN_BUCKETS) start = addMonths(start, span - MIN_BUCKETS);
   return eachMonthOfInterval({ start, end });
};

/**
 * Fold a title's privacy-scrubbed play rows into the aggregates rendered by
 * its dedicated page. Derived viewer counts can only exist when the public
 * DTO already includes viewer identities.
 */
export const buildDossier = (rows: ActivityHistoryItem[]): MediaDossier => {
   if (rows.length === 0) return emptyDossier();

   const ascending = [...rows].sort(
      (a, b) => playTimestamp(a) - playTimestamp(b),
   );

   let totalSeconds = 0;
   let completedPlays = 0;
   const viewerIds = new Set<string>();
   const platformPlays = new Map<string, number>();
   const episodes = new Map<string, DossierEpisodeStat>();
   const episodeFirstSeen = new Map<string, number>();

   for (const row of ascending) {
      const at = playTimestamp(row);
      totalSeconds += Math.max(row.play_duration, 0);
      if (row.watched_status === 1) completedPlays += 1;
      if (row.viewer) viewerIds.add(row.viewer.id);
      if (row.platform) {
         platformPlays.set(
            row.platform,
            (platformPlays.get(row.platform) ?? 0) + 1,
         );
      }

      if (row.media_type !== "episode") continue;

      const key = String(row.rating_key);
      if (!episodeFirstSeen.has(key)) episodeFirstSeen.set(key, at);

      const existing = episodes.get(key);
      if (existing) {
         existing.plays += 1;
         if (row.watched_status === 1) existing.completedPlays += 1;
         existing.lastWatchedAt = Math.max(existing.lastWatchedAt, at);
      } else {
         episodes.set(key, {
            ratingKey: key,
            season: row.parent_media_index ?? 0,
            episode: row.media_index ?? 0,
            title: row.title,
            plays: 1,
            completedPlays: row.watched_status === 1 ? 1 : 0,
            lastWatchedAt: at,
         });
      }
   }

   const firstWatchedAt = playTimestamp(ascending[0]!);
   const lastWatchedAt = playTimestamp(ascending[ascending.length - 1]!);
   const spanDays = (lastWatchedAt - firstWatchedAt) / 86_400;
   const bucketUnit: DossierBucketUnit =
      spanDays <= DAY_BUCKET_MAX_SPAN_DAYS ? "day" : "month";

   const axis = bucketAxis(
      firstWatchedAt * 1000,
      lastWatchedAt * 1000,
      bucketUnit,
   );
   const bucketKey = (ms: number) =>
      format(
         bucketUnit === "day"
            ? startOfDay(new Date(ms))
            : startOfMonth(new Date(ms)),
         "yyyy-MM-dd",
      );

   const buckets: DossierBucket[] = axis.map((date) => ({
      key: format(date, "yyyy-MM-dd"),
      start: date.getTime(),
      plays: 0,
      seconds: 0,
      newEpisodes: 0,
      cumulativeEpisodes: 0,
   }));
   const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

   for (const row of ascending) {
      const bucket = byKey.get(bucketKey(playTimestamp(row) * 1000));
      if (!bucket) continue;
      bucket.plays += 1;
      bucket.seconds += Math.max(row.play_duration, 0);
   }

   for (const at of episodeFirstSeen.values()) {
      const bucket = byKey.get(bucketKey(at * 1000));
      if (bucket) bucket.newEpisodes += 1;
   }

   let runningEpisodes = 0;
   for (const bucket of buckets) {
      runningEpisodes += bucket.newEpisodes;
      bucket.cumulativeEpisodes = runningEpisodes;
   }

   const platforms: DossierPlatform[] = [...platformPlays.entries()]
      .map(([name, plays]) => ({ name, plays }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, TOP_PLATFORMS);
   const descending = [...ascending].reverse();

   return {
      totalPlays: ascending.length,
      totalSeconds,
      firstWatchedAt,
      lastWatchedAt,
      completedPlays,
      distinctEpisodes: episodes.size,
      distinctViewers: viewerIds.size,
      bucketUnit,
      buckets,
      episodes: [...episodes.values()].sort(
         (a, b) => a.season - b.season || a.episode - b.episode,
      ),
      platforms,
      plays: descending.slice(0, PLAY_LOG_LIMIT),
      playsTruncated: descending.length > PLAY_LOG_LIMIT,
   };
};
