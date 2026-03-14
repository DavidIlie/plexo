import "server-only";

import { env } from "~/env";
import { getMediaDetail } from "~/lib/tmdb";
import type {
   OverseerrRequestsResponse,
   WishlistItem,
} from "~/types/overseerr";

const overseerrFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
   if (!env.OVERSEERR_URL || !env.OVERSEERR_API_KEY) {
      throw new Error("Overseerr is not configured");
   }

   const url = new URL(`/api/v1${path}`, env.OVERSEERR_URL);
   const res = await fetch(url.toString(), {
      ...init,
      headers: {
         "X-Api-Key": env.OVERSEERR_API_KEY,
         "Content-Type": "application/json",
         ...init?.headers,
      },
   });

   if (!res.ok) {
      throw new Error(`Overseerr API error: ${res.status} ${res.statusText}`);
   }

   return res.json() as Promise<T>;
};

const STATUS_MAP: Record<number, WishlistItem["status"]> = {
   1: "pending",
   2: "approved",
   3: "processing",
   4: "available",
   5: "available",
};

export const getWishlist = async (): Promise<WishlistItem[]> => {
   const data = await overseerrFetch<OverseerrRequestsResponse>(
      "/request?take=20&sort=added&filter=pending,approved,processing",
   );

   const items = await Promise.all(
      data.results.map(async (req) => {
         const detail = await getMediaDetail(
            req.media.tmdbId,
            req.type,
         );

         return {
            tmdbId: req.media.tmdbId,
            mediaType: req.type,
            title: detail?.title ?? `Unknown (${req.media.tmdbId})`,
            year: detail?.year ?? "",
            posterPath: detail?.posterPath ?? null,
            status: STATUS_MAP[req.status] ?? "pending",
            requestedBy: req.requestedBy.displayName,
            requestedAt: req.createdAt,
         } satisfies WishlistItem;
      }),
   );

   return items;
};

export const createRequest = async (
   tmdbId: number,
   mediaType: "movie" | "tv",
): Promise<void> => {
   await overseerrFetch("/request", {
      method: "POST",
      body: JSON.stringify({ mediaType, mediaId: tmdbId }),
   });
};
