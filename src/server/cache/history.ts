import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "~/lib/cache-tags";
import { buildDossier } from "~/lib/dossier";
import { getHistory, getItemHistoryEntries, getUsers } from "~/lib/tautulli";
import { env } from "~/env";
import type { MediaDossier } from "~/types/dossier";
import type {
   ActivityHistoryData,
   ActivityHistoryItem,
   ActivityViewer,
   TautulliHistoryData,
   TautulliHistoryItem,
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
   index: number,
): ActivityViewer => ({
   id: String(user.user_id),
   label: displayIncludesName
      ? user.friendly_name || user.username
      : `Viewer ${index + 1}`,
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
