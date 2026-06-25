// @ts-check
/** @typedef {import("./remote-handler.js").CacheEntry} CacheEntry */

const MAX_ENTRIES = 1000;

const globalForCache = /** @type {{ __plexoMemHandler?: ReturnType<typeof build> }} */ (
   globalThis
);

/** @typedef {{ tags: string[], stale: number, timestamp: number, expire: number, revalidate: number }} EntryMeta */

function build() {
   /** @type {Map<string, { meta: EntryMeta, buf: Buffer }>} */
   const cache = new Map();
   /** @type {Map<string, number>} */
   const tagTimestamps = new Map();
   /** @type {Map<string, Promise<void>>} */
   const pendingSets = new Map();

   const evictIfNeeded = () => {
      if (cache.size <= MAX_ENTRIES) return;
      const excess = Math.ceil(MAX_ENTRIES * 0.1);
      const keys = cache.keys();
      for (let i = 0; i < excess; i++) {
         const k = keys.next();
         if (k.done) break;
         cache.delete(k.value);
      }
   };

   return {
      /** @param {string} cacheKey @param {string[]} _softTags */
      async get(cacheKey, _softTags) {
         const pending = pendingSets.get(cacheKey);
         if (pending) await pending;

         const stored = cache.get(cacheKey);
         if (!stored) return undefined;

         if (Date.now() > stored.meta.timestamp + stored.meta.expire * 1000) {
            cache.delete(cacheKey);
            return undefined;
         }

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
            revalidate: stored.meta.revalidate,
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
            cache.set(cacheKey, {
               meta: {
                  tags: entry.tags,
                  stale: entry.stale,
                  timestamp: entry.timestamp,
                  expire: entry.expire,
                  revalidate: entry.revalidate,
               },
               buf: Buffer.concat(chunks.map((c) => Buffer.from(c))),
            });
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
            const ts = tagTimestamps.get(t);
            if (ts && ts > max) max = ts;
         }
         return max;
      },

      /** @param {string[]} tags */
      async updateTags(tags) {
         const now = Date.now();
         for (const t of tags) tagTimestamps.set(t, now);
         for (const [key, { meta }] of cache.entries()) {
            if (meta.tags.some((tag) => tags.includes(tag))) cache.delete(key);
         }
      },
   };
}

export function createMemoryHandler() {
   return (globalForCache.__plexoMemHandler ??= build());
}
