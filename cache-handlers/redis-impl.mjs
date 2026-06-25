// @ts-check
import { createClient } from "redis";

/** @typedef {import("redis").RedisClientType} RedisClientType */
/** @typedef {import("./remote-handler.js").CacheEntry} CacheEntry */

const KEY = (/** @type {string} */ k) => `plexo:cache:${k}`;
const TAG = (/** @type {string} */ t) => `plexo:tag:${t}`;
const REVALIDATED_SET = "plexo:revalidated-tags";

const REDIS_MAX_TTL_SECONDS = 2 ** 31 - 1;
const TAG_MARKER_TTL_SECONDS = 24 * 60 * 60;

export function createRedisRemoteHandler(url) {
   /** @type {RedisClientType} */
   const client = createClient({ url });
   client.on("error", (e) => console.error("[remote-cache] redis error:", e));
   const ready = client
      .connect()
      .catch((e) => console.error("[remote-cache] connect failed:", e));

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
      /** @param {string} cacheKey @param {string[]} _softTags */
      async get(cacheKey, _softTags) {
         try {
            await ready;
            const raw = await client.get(KEY(cacheKey));
            if (!raw) return undefined;
            const e = JSON.parse(raw);
            if (Date.now() > e.timestamp + e.expire * 1000) return undefined;
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
            console.error("[remote-cache] get error:", err);
            return undefined;
         }
      },

      /** @param {string} cacheKey @param {Promise<CacheEntry>} pendingEntry */
      async set(cacheKey, pendingEntry) {
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
            const ttl = Math.ceil(entry.expire);
            if (Number.isFinite(ttl) && ttl > 0 && ttl <= REDIS_MAX_TTL_SECONDS) {
               await client.set(KEY(cacheKey), payload, { EX: ttl });
            } else {
               await client.set(KEY(cacheKey), payload);
            }
         } catch (err) {
            console.error("[remote-cache] set error (best-effort):", err);
         }
      },

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
         const timestamps = tags.map((t) => localTags.get(t) ?? 0);
         return Math.max(...timestamps, 0);
      },

      /** @param {string[]} tags @param {{ expire?: number } | undefined} _durations */
      async updateTags(tags, _durations) {
         try {
            await ready;
            const now = Date.now();
            const m = client.multi();
            for (const t of tags) {
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
