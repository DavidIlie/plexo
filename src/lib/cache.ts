interface CacheEntry<T> {
   data: T;
   fetchedAt: Date;
   expiresAt: Date;
}

const cache = new Map<string, CacheEntry<unknown>>();

export const CacheTTL = {
   LIBRARY: 60 * 60 * 1000,
   METADATA: 30 * 60 * 1000,
   ACTIVITY: 5 * 60 * 1000,
   ANALYTICS: 15 * 60 * 1000,
} as const;

export const getCachedOrFetch = async <T>(
   key: string,
   fetcher: () => Promise<T>,
   ttlMs: number = CacheTTL.METADATA,
): Promise<{ data: T; fetchedAt: Date }> => {
   const existing = cache.get(key) as CacheEntry<T> | undefined;

   if (existing && existing.expiresAt.getTime() > Date.now()) {
      return { data: existing.data, fetchedAt: existing.fetchedAt };
   }

   const data = await fetcher();
   const now = new Date();
   const entry: CacheEntry<T> = {
      data,
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
   };
   cache.set(key, entry);

   return { data, fetchedAt: now };
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
