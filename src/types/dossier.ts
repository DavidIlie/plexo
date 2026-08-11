import type { ActivityHistoryItem } from "~/types/tautulli";

export type DossierBucketUnit = "day" | "month";

export interface DossierBucket {
   /** Stable `yyyy-MM-dd` key for the x axis. */
   key: string;
   /** Bucket start, epoch milliseconds. */
   start: number;
   plays: number;
   seconds: number;
   /** Distinct episodes seen for the first time in this bucket. */
   newEpisodes: number;
   /** Running total of distinct episodes seen up to and including this bucket. */
   cumulativeEpisodes: number;
}

export interface DossierEpisodeStat {
   ratingKey: string;
   season: number;
   episode: number;
   title: string;
   plays: number;
   completedPlays: number;
   /** Epoch seconds of the most recent play. */
   lastWatchedAt: number;
}

export interface DossierPlatform {
   name: string;
   plays: number;
}

export interface MediaDossier {
   totalPlays: number;
   totalSeconds: number;
   /** Epoch seconds of the earliest recorded play, or null when never played. */
   firstWatchedAt: number | null;
   lastWatchedAt: number | null;
   /** Plays Tautulli marked as watched through to the end. */
   completedPlays: number;
   /** Distinct episodes with at least one play (0 for movies). */
   distinctEpisodes: number;
   /**
    * Distinct viewers behind these plays. Always 0 when the deployment hides
    * viewer identities, because it is derived from the public viewer DTOs.
    */
   distinctViewers: number;
   bucketUnit: DossierBucketUnit;
   buckets: DossierBucket[];
   episodes: DossierEpisodeStat[];
   platforms: DossierPlatform[];
   /** Most recent plays first, capped for transport. */
   plays: ActivityHistoryItem[];
   /** True when `plays` is a prefix of a longer log. */
   playsTruncated: boolean;
}
