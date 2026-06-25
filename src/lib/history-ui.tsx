import { Film, Tv, Music } from "lucide-react";

import type { PlexMediaItem } from "~/types/plex";
import type { TautulliHistoryItem } from "~/types/tautulli";

export const mediaTypeIcon = (
   type: string,
   className = "h-3.5 w-3.5 text-primary/60",
) => {
   if (type === "track") return <Music className={className} />;
   if (type === "episode" || type === "show") return <Tv className={className} />;
   return <Film className={className} />;
};

export const historyItemToMediaItem = (
   item: TautulliHistoryItem,
): PlexMediaItem => ({
   ratingKey: String(item.grandparent_rating_key || item.rating_key),
   key: "",
   type: item.media_type === "episode" ? "show" : item.media_type,
   title: item.grandparent_title || item.title,
   addedAt: 0,
});

export const historyArtistKey = (item: TautulliHistoryItem) =>
   String(item.grandparent_rating_key || item.rating_key);
