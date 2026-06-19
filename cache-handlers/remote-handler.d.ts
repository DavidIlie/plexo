export interface CacheEntry {
   value: ReadableStream<Uint8Array>;
   tags: string[];
   stale: number;
   timestamp: number;
   expire: number;
   revalidate: number;
}

export interface RemoteCacheHandler {
   get(cacheKey: string, softTags: string[]): Promise<CacheEntry | undefined>;
   set(cacheKey: string, pendingEntry: Promise<CacheEntry>): Promise<void>;
   refreshTags(): Promise<void>;
   getExpiration(tags: string[]): Promise<number>;
   updateTags(tags: string[], durations?: { expire?: number }): Promise<void>;
}

declare const handler: RemoteCacheHandler;
export default handler;
