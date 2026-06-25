import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "~/lib/cache-tags";
import { getHistory } from "~/lib/tautulli";

export const getHistoryWindow = async (
   length: number,
   start: number,
   mediaType: string | undefined,
) => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliHistory);
   return getHistory(length, start, mediaType);
};

export const getItemHistoryCached = async (ratingKey: string) => {
   "use cache";
   cacheLife("activity");
   cacheTag(CACHE_TAGS.tautulli, CACHE_TAGS.tautulliItem(ratingKey));

   const history = await getHistory(200);
   return history.data.filter(
      (item) =>
         String(item.rating_key) === ratingKey ||
         String(item.grandparent_rating_key) === ratingKey,
   );
};
