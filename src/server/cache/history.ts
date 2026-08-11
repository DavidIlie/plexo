import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "~/lib/cache-tags";
import { buildDossier } from "~/lib/dossier";
import {
   getActivity,
   getHistory,
   getItemHistoryEntries,
   getUsers,
} from "~/lib/tautulli";
import { env } from "~/env";
import type { MediaDossier } from "~/types/dossier";
import type {
   ActivityHistoryData,
   ActivityHistoryItem,
   ActivityViewer,
   CurrentActivityData,
   CurrentActivitySession,
   TautulliHistoryData,
   TautulliHistoryItem,
   TautulliActivitySession,
   TautulliUser,
} from "~/types/tautulli";

const displayIncludesName =
   env.VIEWER_DISPLAY === "name" || env.VIEWER_DISPLAY === "avatar-name";

const displayIncludesAvatar =
   env.VIEWER_DISPLAY === "avatar" || env.VIEWER_DISPLAY === "avatar-name";

const configuredUsers = (users: TautulliUser[]) => {
   if (!env.TAUTULLI_USER_ID) return users;
   return users.filter(
      (user) => String(user.user_id) === env.TAUTULLI_USER_ID,
   );
};

const identityUsers = (users: TautulliUser[]) => {
   const configured = configuredUsers(users);
   if (env.TAUTULLI_USER_ID) return configured;
   return configured.filter((user) => user.is_active === 1);
};

const toPublicViewer = (
   user: TautulliUser,
): ActivityViewer => ({
   id: String(user.user_id),
   label: user.friendly_name || user.username,
   ...(displayIncludesName
      ? { name: user.friendly_name || user.username }
      : {}),
   showAvatar: displayIncludesAvatar,
   hasAvatar: displayIncludesAvatar && Boolean(user.thumb),
});

export const getActivityViewers = async (): Promise<ActivityViewer[]> => {
   if (env.VIEWER_DISPLAY === "hidden") return [];

   const users = identityUsers(await getUsers());
   return users.map(toPublicViewer);
};

export const getActivityViewer = async (
   viewerId: string | undefined,
): Promise<ActivityViewer | undefined> => {
   if (!viewerId || env.VIEWER_DISPLAY === "hidden" || env.TAUTULLI_USER_ID) {
      return undefined;
   }

   const viewers = await getActivityViewers();
   return viewers.find((viewer) => viewer.id === viewerId);
};

const publicRows = async (
   items: TautulliHistoryItem[],
): Promise<ActivityHistoryItem[]> => {
   const viewerById = new Map<string, ActivityViewer>();
   if (env.VIEWER_DISPLAY !== "hidden") {
      const users = identityUsers(await getUsers());
      const publicViewers = users.map(toPublicViewer);
      users.forEach((user, index) => {
         const viewer = publicViewers[index];
         if (viewer) viewerById.set(String(user.user_id), viewer);
      });
   }

   // This remains an allowlist rather than an omit. New upstream identity or
   // session fields must never silently cross the public boundary.
   return items.map((item): ActivityHistoryItem => {
      const viewer = viewerById.get(String(item.user_id));
      return {
         reference_id: item.reference_id,
         row_id: item.row_id,
         id: item.id,
         date: item.date,
         started: item.started,
         stopped: item.stopped,
         duration: item.duration,
         play_duration: item.play_duration,
         paused_counter: item.paused_counter,
         platform: item.platform,
         product: item.product,
         player: item.player,
         title: item.title,
         parent_title: item.parent_title,
         grandparent_title: item.grandparent_title,
         full_title: item.full_title,
         media_type: item.media_type,
         year: item.year,
         thumb: item.thumb,
         parent_thumb: item.parent_thumb,
         grandparent_thumb: item.grandparent_thumb,
         rating_key: item.rating_key,
         parent_rating_key: item.parent_rating_key,
         grandparent_rating_key: item.grandparent_rating_key,
         ip_address: env.SHOW_LOCATIONS ? item.ip_address : "",
         watched_status: item.watched_status,
         group_count: item.group_count,
         group_ids: item.group_ids,
         media_index: item.media_index,
         parent_media_index: item.parent_media_index,
         transcode_decision: item.transcode_decision,
         guid: item.guid,
         ...(viewer ? { viewer } : {}),
      };
   });
};

const numericValue = (value: number | string): number => {
   const parsed = Number(value);
   return Number.isFinite(parsed) ? parsed : 0;
};

const publicActivitySession = (
   item: TautulliActivitySession,
   viewer: ActivityViewer | undefined,
): CurrentActivitySession => ({
   sessionKey: String(item.session_key || item.session_id),
   state: item.state,
   mediaType: item.media_type,
   title: item.title,
   parentTitle: item.parent_title,
   grandparentTitle: item.grandparent_title,
   fullTitle: item.full_title,
   year: numericValue(item.year),
   ratingKey: String(item.rating_key),
   parentRatingKey: String(item.parent_rating_key),
   grandparentRatingKey: String(item.grandparent_rating_key),
   mediaIndex: numericValue(item.media_index),
   parentMediaIndex: numericValue(item.parent_media_index),
   durationMs: numericValue(item.duration),
   viewOffsetMs: numericValue(item.view_offset),
   progressPercent: numericValue(item.progress_percent),
   thumb: item.thumb,
   parentThumb: item.parent_thumb,
   grandparentThumb: item.grandparent_thumb,
   art: item.art,
   qualityProfile: item.quality_profile,
   bandwidthKbps: numericValue(item.bandwidth),
   sourceBitrateKbps: numericValue(item.bitrate),
   streamBitrateKbps: numericValue(item.stream_bitrate),
   sourceContainer: item.container,
   streamContainer: item.stream_container,
   transcodeDecision: item.transcode_decision,
   videoDecision: item.video_decision,
   audioDecision: item.audio_decision,
   subtitleDecision: item.subtitle_decision,
   sourceVideoResolution:
      item.video_full_resolution || item.video_resolution,
   sourceVideoCodec: item.video_codec,
   sourceVideoDynamicRange: item.video_dynamic_range,
   streamVideoResolution:
      item.stream_video_full_resolution || item.stream_video_resolution,
   streamVideoCodec: item.stream_video_codec,
   streamVideoDynamicRange: item.stream_video_dynamic_range,
   streamVideoDecision: item.stream_video_decision,
   sourceAudioCodec: item.audio_codec,
   sourceAudioChannels:
      item.audio_channel_layout || String(item.audio_channels || ""),
   streamAudioCodec: item.stream_audio_codec,
   streamAudioChannels:
      item.stream_audio_channel_layout ||
      String(item.stream_audio_channels || ""),
   streamAudioDecision: item.stream_audio_decision,
   subtitleCodec: item.stream_subtitle_codec || item.subtitle_codec,
   subtitleLanguage:
      item.stream_subtitle_language || item.subtitle_language,
   streamSubtitleDecision:
      item.stream_subtitle_decision || item.subtitle_decision,
   hardwareTranscode:
      numericValue(item.transcode_hw_decoding) > 0 ||
      numericValue(item.transcode_hw_encoding) > 0,
   transcodeThrottled: numericValue(item.transcode_throttled) > 0,
   ...(env.SHOW_DEVICES
      ? {
           platform: item.platform,
           product: item.product,
           player: item.player,
           device: item.device,
        }
      : {}),
   ...(viewer ? { viewer } : {}),
});

/**
 * Return an allowlisted, deployment-scoped snapshot of current Plex streams.
 * This intentionally stays uncached; the dashboard polls it while visible.
 */
export const getCurrentActivity = async (): Promise<CurrentActivityData> => {
   const activity = await getActivity();
   const sessions = env.TAUTULLI_USER_ID
      ? activity.sessions.filter(
           (session) => String(session.user_id) === env.TAUTULLI_USER_ID,
        )
      : activity.sessions;

   const viewerById = new Map<string, ActivityViewer>();
   if (env.VIEWER_DISPLAY !== "hidden") {
      const users = identityUsers(await getUsers());
      for (const user of users) {
         viewerById.set(String(user.user_id), toPublicViewer(user));
      }
   }

   const publicSessions = sessions.map((session) =>
      publicActivitySession(
         session,
         viewerById.get(String(session.user_id)),
      ),
   );

   return {
      sessions: publicSessions,
      streamCount: publicSessions.length,
      totalBandwidthKbps: publicSessions.reduce(
         (total, session) => total + session.bandwidthKbps,
         0,
      ),
   };
};

const publicHistory = async (
   history: TautulliHistoryData,
): Promise<ActivityHistoryData> => ({
   ...history,
   data: await publicRows(history.data),
});

const allowedViewerId = async (viewerId: string | undefined) => {
   if (
      !viewerId ||
      env.VIEWER_DISPLAY === "hidden" ||
      env.TAUTULLI_USER_ID
   ) {
      return undefined;
   }

   const users = identityUsers(await getUsers());
   if (!users.some((user) => String(user.user_id) === viewerId)) {
      throw new Error("Unknown activity viewer");
   }
   return viewerId;
};

export const getHistoryWindow = async (
   length: number,
   start: number,
   mediaType: string | undefined,
   viewerId?: string,
) => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliHistory);
   const userId = await allowedViewerId(viewerId);
   const history = await getHistory(length, start, mediaType, userId);
   return publicHistory(history);
};

export const getItemHistoryCached = async (ratingKey: string) => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliItem(ratingKey));

   return publicRows(await getItemHistoryEntries(ratingKey));
};

export const getMediaDossierCached = async (
   ratingKey: string,
): Promise<MediaDossier> => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliItem(ratingKey));

   return buildDossier(await publicRows(await getItemHistoryEntries(ratingKey)));
};

export const getViewerAvatar = async (viewerId: string) => {
   if (!displayIncludesAvatar) return null;

   const user = identityUsers(await getUsers()).find(
      (candidate) => String(candidate.user_id) === viewerId,
   );
   if (!user?.thumb) return null;

   try {
      const url = new URL(user.thumb);
      const isPlexAvatar =
         url.protocol === "https:" &&
         (url.hostname === "plex.tv" || url.hostname.endsWith(".plex.tv")) &&
         url.pathname.startsWith("/users/") &&
         url.pathname.endsWith("/avatar");

      return isPlexAvatar ? url.toString() : null;
   } catch {
      return null;
   }
};
