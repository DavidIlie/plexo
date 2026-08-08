// @ts-check
/** @typedef {import("./remote-handler.js").CacheEntry} CacheEntry */

// Byte budget mirroring Next's default cacheMaxMemorySize (50 MB) — that
// setting does not apply to custom cacheHandlers, so we enforce it here.
const MAX_BYTES = 50 * 1024 * 1024;
// Secondary cap on entry count.
const MAX_ENTRIES = 1000;

const globalForCache = /** @type {{ __plexoMemHandler?: ReturnType<typeof build> }} */ (
   globalThis
);

/** @typedef {{ tags: string[], stale: number, timestamp: number, expire: number, revalidate: number }} EntryMeta */

/**
 * Per-tag invalidation marker, mirroring Next's built-in tags-manifest
 * semantics: `stale` forces background revalidation (entry still served with
 * `revalidate: -1`); `expired` is a hard miss once the moment passes.
 * `revalidateTag(tag, "max")` → stale now, expired in the far future
 * (stale-while-revalidate); `revalidateTag(tag, { expire: 0 })` → both now.
 * @typedef {{ stale: number, expired: number }} TagMarker
 */

function build() {
   // Map iteration order doubles as the LRU order: get() re-inserts the
   // touched key so eviction (oldest-first) removes the least recently used.
   /** @type {Map<string, { meta: EntryMeta, buf: Buffer, size: number }>} */
   const cache = new Map();
   /** @type {Map<string, TagMarker>} */
   const tagMarkers = new Map();
   /** @type {Map<string, Promise<void>>} */
   const pendingSets = new Map();
   let totalBytes = 0;

   /** @param {string} key */
   const evict = (key) => {
      const stored = cache.get(key);
      if (!stored) return;
      totalBytes -= stored.size;
      cache.delete(key);
   };

   const evictIfNeeded = () => {
      while (
         (totalBytes > MAX_BYTES || cache.size > MAX_ENTRIES) &&
         cache.size > 0
      ) {
         const oldest = cache.keys().next();
         if (oldest.done) break;
         evict(oldest.value);
      }
   };

   return {
      /** @param {string} cacheKey @param {string[]} _softTags */
      async get(cacheKey, _softTags) {
         const pending = pendingSets.get(cacheKey);
         if (pending) await pending;

         const stored = cache.get(cacheKey);
         if (!stored) return undefined;

         const now = Date.now();

         if (now > stored.meta.timestamp + stored.meta.expire * 1000) {
            evict(cacheKey);
            return undefined;
         }

         let revalidate = stored.meta.revalidate;
         for (const tag of stored.meta.tags) {
            const marker = tagMarkers.get(tag);
            if (!marker) continue;
            // Hard-expired: invalidated after the entry was created and the
            // expiration moment has passed → miss.
            if (
               marker.expired > stored.meta.timestamp &&
               marker.expired <= now
            ) {
               evict(cacheKey);
               return undefined;
            }
            // Stale: serve, but force a background revalidation.
            if (marker.stale > stored.meta.timestamp) {
               revalidate = -1;
            }
         }

         // Refresh LRU recency.
         cache.delete(cacheKey);
         cache.set(cacheKey, stored);

         const buf = stored.buf;
         return {
            value: new ReadableStream({
               start(c) {
                  c.enqueue(new Uint8Array(buf));
                  c.close();
               },
            }),
            tags: stored.meta.tags,
            stale: stored.meta.stale,
            timestamp: stored.meta.timestamp,
            expire: stored.meta.expire,
            revalidate,
         };
      },

      /** @param {string} cacheKey @param {Promise<CacheEntry>} pendingEntry */
      async set(cacheKey, pendingEntry) {
         let resolvePending = () => {};
         const p = new Promise((resolve) => {
            resolvePending = resolve;
         });
         pendingSets.set(cacheKey, p);
         try {
            const entry = await pendingEntry;
            const reader = entry.value.getReader();
            /** @type {Uint8Array[]} */
            const chunks = [];
            try {
               for (;;) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (value) chunks.push(value);
               }
            } finally {
               reader.releaseLock();
            }
            const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
            const size = buf.byteLength + cacheKey.length;
            evict(cacheKey);
            cache.set(cacheKey, {
               meta: {
                  tags: entry.tags,
                  stale: entry.stale,
                  timestamp: entry.timestamp,
                  expire: entry.expire,
                  revalidate: entry.revalidate,
               },
               buf,
               size,
            });
            totalBytes += size;
            evictIfNeeded();
         } finally {
            resolvePending();
            pendingSets.delete(cacheKey);
         }
      },

      async refreshTags() {},

      /** @param {string[]} tags */
      async getExpiration(tags) {
         let max = 0;
         for (const t of tags) {
            const marker = tagMarkers.get(t);
            if (marker && marker.expired > max) max = marker.expired;
         }
         return max;
      },

      /** @param {string[]} tags @param {{ expire?: number } | undefined} durations */
      async updateTags(tags, durations) {
         const now = Date.now();
         // No durations (or expire: 0) → hard invalidation now. A positive
         // expire → stale-while-revalidate: entries are served (and refreshed
         // in the background) until now + expire.
         const expired =
            durations === undefined ||
            durations.expire === undefined ||
            durations.expire === 0
               ? now
               : now + durations.expire * 1000;
         for (const t of tags) tagMarkers.set(t, { stale: now, expired });
      },
   };
}

export function createMemoryHandler() {
   return (globalForCache.__plexoMemHandler ??= build());
}
