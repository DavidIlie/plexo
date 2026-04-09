interface CacheEntry<T> {
   data: T;
   fetchedAt: Date;
   expiresAt: Date;
   ttlMs: number;
}

const MAX_CACHE_SIZE = 500;

const globalForCache = globalThis as unknown as {
   __plexoCache?: Map<string, CacheEntry<unknown>>;
   __plexoInFlight?: Map<string, Promise<unknown>>;
};

const cache = (globalForCache.__plexoCache ??= new Map<
   string,
   CacheEntry<unknown>
>());

const inFlight = (globalForCache.__plexoInFlight ??= new Map<
   string,
   Promise<unknown>
>());

export const CacheTTL = {
   LIBRARY: 60 * 60 * 1000,
   METADATA: 30 * 60 * 1000,
   ACTIVITY: 5 * 60 * 1000,
   ANALYTICS: 15 * 60 * 1000,
} as const;

const evictOldest = () => {
   const evictCount = Math.ceil(MAX_CACHE_SIZE * 0.1);
   const keys = cache.keys();
   for (let i = 0; i < evictCount; i++) {
      const result = keys.next();
      if (result.done) break;
      cache.delete(result.value);
   }
};

const doFetch = async <T>(
   key: string,
   fetcher: () => Promise<T>,
   ttlMs: number,
): Promise<{ data: T; fetchedAt: Date }> => {
   const existing = inFlight.get(key);
   if (existing) {
      return existing as Promise<{ data: T; fetchedAt: Date }>;
   }

   const promise = fetcher()
      .then((data) => {
         const now = new Date();
         const entry: CacheEntry<T> = {
            data,
            fetchedAt: now,
            expiresAt: new Date(now.getTime() + ttlMs),
            ttlMs,
         };
         cache.set(key, entry);

         if (cache.size > MAX_CACHE_SIZE) {
            evictOldest();
         }

         return { data, fetchedAt: now };
      })
      .finally(() => {
         inFlight.delete(key);
      });

   inFlight.set(key, promise);
   return promise;
};

export const getCachedOrFetch = async <T>(
   key: string,
   fetcher: () => Promise<T>,
   ttlMs: number = CacheTTL.METADATA,
): Promise<{ data: T; fetchedAt: Date }> => {
   const existing = cache.get(key) as CacheEntry<T> | undefined;

   if (existing) {
      // Fresh hit — return immediately
      if (existing.expiresAt.getTime() > Date.now()) {
         return { data: existing.data, fetchedAt: existing.fetchedAt };
      }

      // Stale — return old data immediately, revalidate in background
      void doFetch(key, fetcher, ttlMs);
      return { data: existing.data, fetchedAt: existing.fetchedAt };
   }

   // No cached data at all — must wait for fetch
   return doFetch(key, fetcher, ttlMs);
};

export const invalidateAll = () => {
   cache.clear();
};

export const invalidateByPrefix = (prefix: string) => {
   for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
         cache.delete(key);
      }
   }
};

export const getCacheStats = () => {
   const entries: Array<{
      key: string;
      fetchedAt: string;
      expiresAt: string;
      expired: boolean;
   }> = [];

   for (const [key, entry] of cache.entries()) {
      entries.push({
         key,
         fetchedAt: entry.fetchedAt.toISOString(),
         expiresAt: entry.expiresAt.toISOString(),
         expired: entry.expiresAt.getTime() < Date.now(),
      });
   }

   return {
      totalEntries: cache.size,
      activeEntries: entries.filter((e) => !e.expired).length,
      inFlightCount: inFlight.size,
      entries: entries.sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt)),
   };
};
