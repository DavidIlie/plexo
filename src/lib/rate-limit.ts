const globalForRateLimit = globalThis as unknown as {
   __plexoRateLimit?: Map<string, { count: number; resetAt: number }>;
};

const hits = (globalForRateLimit.__plexoRateLimit ??= new Map<
   string,
   { count: number; resetAt: number }
>());

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 120;

export const checkRateLimit = (
   key: string,
   windowMs = DEFAULT_WINDOW_MS,
   maxRequests = DEFAULT_MAX_REQUESTS,
): { allowed: boolean; remaining: number } => {
   const now = Date.now();
   const entry = hits.get(key);

   if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
   }

   entry.count++;
   const remaining = Math.max(0, maxRequests - entry.count);

   if (entry.count > maxRequests) {
      return { allowed: false, remaining: 0 };
   }

   return { allowed: true, remaining };
};

export const resetRateLimitKey = (key: string) => {
   hits.delete(key);
};

export const getRateLimitStats = () => {
   const now = Date.now();
   const active: Array<{ key: string; count: number; remaining: number; resetsIn: number }> = [];

   for (const [key, entry] of hits.entries()) {
      if (now < entry.resetAt) {
         active.push({
            key: key.replace("trpc:", ""),
            count: entry.count,
            remaining: Math.max(0, DEFAULT_MAX_REQUESTS - entry.count),
            resetsIn: Math.round((entry.resetAt - now) / 1000),
         });
      }
   }

   return active.sort((a, b) => b.count - a.count);
};
