// @ts-check
import { createClient } from "@redis/client";

/** @typedef {import("@redis/client").RedisClientType} RedisClientType */
/** @typedef {import("./remote-handler.js").CacheEntry} CacheEntry */

/**
 * Per-tag invalidation marker, mirroring Next's built-in tags-manifest
 * semantics (node_modules/next/dist/server/lib/cache-handlers/default.js):
 * - `stale`: entries created before this are served with `revalidate: -1`
 *   (stale-while-revalidate — background refresh, no user-facing miss).
 * - `expired`: entries created before this are treated as a hard miss once
 *   the expiration moment has passed.
 * `revalidateTag(tag, "max")` maps to `updateTags(tags, { expire: 31536000 })`
 * — stale now, expired far in the future — while `revalidateTag(tag,
 * { expire: 0 })` (the `?hard=1` path) expires immediately.
 * @typedef {{ stale: number, expired: number }} TagMarker
 */

const KEY = (/** @type {string} */ k) => `plexo:cache:${k}`;
const TAG = (/** @type {string} */ t) => `plexo:tag:${t}`;
const REVALIDATED_SET = "plexo:revalidated-tags";

const REDIS_MAX_TTL_SECONDS = 2 ** 31 - 1;
// Entry TTLs are clamped to this in set() so no cache entry can outlive its
// tag markers — otherwise an invalidated entry could "resurrect" once the
// marker expires. Longest cacheLife profile in use is library (7200s).
const TAG_MARKER_TTL_SECONDS = 24 * 60 * 60;

/**
 * @param {string | null} raw
 * @returns {TagMarker | undefined}
 */
function parseMarker(raw) {
   if (raw == null) return undefined;
   try {
      const parsed = JSON.parse(raw);
      if (
         parsed &&
         typeof parsed === "object" &&
         typeof parsed.stale === "number" &&
         typeof parsed.expired === "number"
      ) {
         return { stale: parsed.stale, expired: parsed.expired };
      }
   } catch {
      // Legacy marker format: a plain epoch-ms string meaning "expired now".
   }
   const ts = Number(raw);
   return Number.isFinite(ts) ? { stale: ts, expired: ts } : undefined;
}

export function createRedisRemoteHandler(url) {
   /** @type {RedisClientType} */
   const client = createClient({ url });
   client.on("error", (e) => console.error("[remote-cache] redis error:", e));
   const ready = client
      .connect()
      .catch((e) => console.error("[remote-cache] connect failed:", e));

   /** @type {Map<string, TagMarker>} */
   const localTags = new Map();
   /** @type {Map<string, Promise<void>>} */
   const pendingSets = new Map();

   /** @param {ReadableStream<Uint8Array>} stream */
   async function streamToBase64(stream) {
      /** @type {Uint8Array[]} */
      const chunks = [];
      const reader = stream.getReader();
      try {
         for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
         }
      } finally {
         reader.releaseLock();
      }
      return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("base64");
   }

   /** @param {string} b64 */
   function base64ToStream(b64) {
      const buf = Buffer.from(b64, "base64");
      return new ReadableStream({
         start(c) {
            c.enqueue(new Uint8Array(buf));
            c.close();
         },
      });
   }

   return {
      /** @param {string} cacheKey @param {string[]} _softTags */
      async get(cacheKey, _softTags) {
         // Per the CacheHandler contract, a get() racing an in-flight set()
         // for the same key must wait for the set instead of missing —
         // otherwise concurrent renders re-execute the cached function.
         const pending = pendingSets.get(cacheKey);
         if (pending) await pending;

         try {
            await ready;
            const raw = await client.get(KEY(cacheKey));
            if (!raw) return undefined;
            const e = JSON.parse(raw);
            if (Date.now() > e.timestamp + e.expire * 1000) return undefined;

            const now = Date.now();
            let revalidate = e.revalidate;
            for (const tag of e.tags) {
               const marker = localTags.get(tag);
               if (!marker) continue;
               // Hard-expired: invalidated after the entry was created and
               // the expiration moment has passed → miss.
               if (marker.expired > e.timestamp && marker.expired <= now) {
                  return undefined;
               }
               // Stale: serve the entry but force a background revalidation.
               if (marker.stale > e.timestamp) {
                  revalidate = -1;
               }
            }

            return {
               value: base64ToStream(e.value),
               tags: e.tags,
               stale: e.stale,
               timestamp: e.timestamp,
               expire: e.expire,
               revalidate,
            };
         } catch (err) {
            console.error("[remote-cache] get error:", err);
            return undefined;
         }
      },

      /** @param {string} cacheKey @param {Promise<CacheEntry>} pendingEntry */
      async set(cacheKey, pendingEntry) {
         let resolvePending = () => {};
         const p = new Promise((resolve) => {
            resolvePending = resolve;
         });
         pendingSets.set(cacheKey, p);
         try {
            await ready;
            const entry = await pendingEntry;
            const value = await streamToBase64(entry.value);
            const payload = JSON.stringify({
               value,
               tags: entry.tags,
               stale: entry.stale,
               timestamp: entry.timestamp,
               expire: entry.expire,
               revalidate: entry.revalidate,
            });
            // Clamp so entries never outlive their tag markers (see
            // TAG_MARKER_TTL_SECONDS). The entry's logical `expire` field is
            // preserved in the payload; this only bounds Redis retention.
            const ttl = Math.min(
               Math.ceil(entry.expire),
               TAG_MARKER_TTL_SECONDS,
            );
            if (Number.isFinite(ttl) && ttl > 0 && ttl <= REDIS_MAX_TTL_SECONDS) {
               await client.set(KEY(cacheKey), payload, { EX: ttl });
            } else {
               await client.set(KEY(cacheKey), payload, {
                  EX: TAG_MARKER_TTL_SECONDS,
               });
            }
         } catch (err) {
            console.error("[remote-cache] set error (best-effort):", err);
         } finally {
            resolvePending();
            pendingSets.delete(cacheKey);
         }
      },

      async refreshTags() {
         try {
            await ready;
            const tags = await client.sMembers(REVALIDATED_SET);
            if (!tags.length) return;
            const vals = await client.mGet(tags.map(TAG));
            /** @type {string[]} */
            const gone = [];
            tags.forEach((t, i) => {
               const marker = parseMarker(vals[i]);
               if (marker) localTags.set(t, marker);
               else {
                  localTags.delete(t);
                  gone.push(t);
               }
            });
            if (gone.length) await client.sRem(REVALIDATED_SET, gone);
         } catch (err) {
            console.error("[remote-cache] refreshTags error:", err);
         }
      },

      /** @param {string[]} tags */
      async getExpiration(tags) {
         // Mirrors the default handler: report the most recent expiration
         // timestamp among the given tags (0 when never invalidated).
         let max = 0;
         for (const t of tags) {
            const marker = localTags.get(t);
            if (marker && marker.expired > max) max = marker.expired;
         }
         return max;
      },

      /** @param {string[]} tags @param {{ expire?: number } | undefined} durations */
      async updateTags(tags, durations) {
         try {
            await ready;
            const now = Date.now();
            // No durations (or expire: 0) → hard invalidation now. A positive
            // expire → stale-while-revalidate until now + expire.
            const expired =
               durations === undefined ||
               durations.expire === undefined ||
               durations.expire === 0
                  ? now
                  : now + durations.expire * 1000;
            /** @type {TagMarker} */
            const marker = { stale: now, expired };
            const payload = JSON.stringify(marker);
            const m = client.multi();
            for (const t of tags) {
               m.set(TAG(t), payload, { EX: TAG_MARKER_TTL_SECONDS });
               m.sAdd(REVALIDATED_SET, t);
               localTags.set(t, marker);
            }
            await m.exec();
         } catch (err) {
            console.error("[remote-cache] updateTags error:", err);
         }
      },
   };
}
