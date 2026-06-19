// @ts-check
import { createClient } from "redis";

/** @typedef {import("redis").RedisClientType} RedisClientType */
/** @typedef {import("./remote-handler.js").CacheEntry} CacheEntry */

const KEY = (/** @type {string} */ k) => `plexo:cache:${k}`;
const TAG = (/** @type {string} */ t) => `plexo:tag:${t}`;
const REVALIDATED_SET = "plexo:revalidated-tags";

// Redis EX accepts a 32-bit signed seconds value; anything larger (or the
// `use cache` "never expires" sentinel) must be stored without a TTL.
const REDIS_MAX_TTL_SECONDS = 2 ** 31 - 1;

// Tag revalidation markers only need to outlive the longest-lived cache entry
// (max cacheLife `expire` is ~2h); 24h gives ample headroom and lets markers
// self-expire so the revalidated-tags set can be pruned instead of leaking.
const TAG_MARKER_TTL_SECONDS = 24 * 60 * 60;

/**
 * Build a Next.js `cacheHandlers.remote` handler backed by Redis.
 * Implements the CacheHandler interface (get/set/refreshTags/getExpiration/
 * updateTags) and mirrors the distributed tag-coordination pattern from the
 * official Next.js cacheHandlers docs.
 *
 * @param {string} url Redis connection URL (redis:// or rediss://)
 */
export function createRedisRemoteHandler(url) {
   /** @type {RedisClientType} */
   const client = createClient({ url });
   client.on("error", (e) => console.error("[remote-cache] redis error:", e));
   // Connect lazily; every method awaits `ready` so a slow connect never
   // throws synchronously into a render.
   const ready = client
      .connect()
      .catch((e) => console.error("[remote-cache] connect failed:", e));

   // Local mirror of tag -> last-revalidated timestamp (ms), synced from Redis
   // in refreshTags(). Mirrors the doc's distributed example exactly.
   /** @type {Map<string, number>} */
   const localTags = new Map();

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
      /**
       * @param {string} cacheKey
       * @param {string[]} _softTags soft tags handled via getExpiration
       */
      async get(cacheKey, _softTags) {
         try {
            await ready;
            const raw = await client.get(KEY(cacheKey));
            if (!raw) return undefined;
            const e = JSON.parse(raw);
            // Hard-miss only past `expire` (dead). Entries past `revalidate`
            // are STALE-BUT-SERVEABLE: we return them so Next serves stale and
            // triggers a background revalidate (stale-while-revalidate). This
            // preserves the "never a blank skeleton on refetch" rule.
            if (Date.now() > e.timestamp + e.expire * 1000) return undefined;
            // Cross-instance explicit-tag invalidation: Next only routes its
            // implicit (_N_T_ path) tags through getExpiration(); explicit
            // cacheTag() tags are checked in-process on the instance that called
            // revalidateTag and never reach other instances. So check the
            // entry's OWN tags here against localTags (synced from Redis in
            // refreshTags() before each request) and hard-miss if any was
            // revalidated after this entry was written.
            for (const tag of e.tags) {
               const revAt = localTags.get(tag);
               if (revAt && revAt > e.timestamp) return undefined;
            }
            return {
               value: base64ToStream(e.value),
               tags: e.tags,
               stale: e.stale,
               timestamp: e.timestamp,
               expire: e.expire,
               revalidate: e.revalidate,
            };
         } catch (err) {
            // Next does NOT wrap get() in try/catch — an unhandled throw becomes
            // a render error. Swallow and signal a clean miss.
            console.error("[remote-cache] get error:", err);
            return undefined;
         }
      },

      /**
       * @param {string} cacheKey
       * @param {Promise<CacheEntry>} pendingEntry
       */
      async set(cacheKey, pendingEntry) {
         try {
            await ready;
            const entry = await pendingEntry; // may still be generating
            const value = await streamToBase64(entry.value);
            const payload = JSON.stringify({
               value,
               tags: entry.tags,
               stale: entry.stale,
               timestamp: entry.timestamp,
               expire: entry.expire,
               revalidate: entry.revalidate,
            });
            // Only set a Redis TTL for a finite, in-range `expire`. The
            // `use cache` default profile is "never expires by time", which
            // arrives as a huge/Infinite value — store it with no EX.
            const ttl = Math.ceil(entry.expire);
            if (Number.isFinite(ttl) && ttl > 0 && ttl <= REDIS_MAX_TTL_SECONDS) {
               await client.set(KEY(cacheKey), payload, { EX: ttl });
            } else {
               await client.set(KEY(cacheKey), payload);
            }
         } catch (err) {
            // set() runs after the response is already flowing; a failure just
            // means the next request re-renders. Best-effort.
            console.error("[remote-cache] set error (best-effort):", err);
         }
      },

      // Called before each request; pull recent invalidations into localTags and
      // prune markers that have expired so the revalidated-tags set stays bounded.
      async refreshTags() {
         try {
            await ready;
            const tags = await client.sMembers(REVALIDATED_SET);
            if (!tags.length) return;
            const vals = await client.mGet(tags.map(TAG));
            /** @type {string[]} */
            const stale = [];
            tags.forEach((t, i) => {
               if (vals[i] != null) localTags.set(t, Number(vals[i]));
               else {
                  localTags.delete(t);
                  stale.push(t);
               }
            });
            if (stale.length) await client.sRem(REVALIDATED_SET, stale);
         } catch (err) {
            console.error("[remote-cache] refreshTags error:", err);
         }
      },

      /** @param {string[]} tags */
      async getExpiration(tags) {
         // Doc-exact: most recent revalidation across the tags, else 0.
         const timestamps = tags.map((t) => localTags.get(t) ?? 0);
         return Math.max(...timestamps, 0);
      },

      /**
       * @param {string[]} tags
       * @param {{ expire?: number } | undefined} _durations
       */
      async updateTags(tags, _durations) {
         try {
            await ready;
            const now = Date.now();
            const m = client.multi();
            for (const t of tags) {
               // Always give the marker a fixed TTL so it self-expires (avoids
               // an unbounded keyspace). `_durations.expire` governs the cache
               // entry's lifetime, not the marker's — and `EX: 0` (the hard
               // `?hard=1` path) is invalid in Redis, so it must not be passed.
               m.set(TAG(t), String(now), { EX: TAG_MARKER_TTL_SECONDS });
               m.sAdd(REVALIDATED_SET, t);
               localTags.set(t, now);
            }
            await m.exec();
         } catch (err) {
            console.error("[remote-cache] updateTags error:", err);
         }
      },
   };
}
