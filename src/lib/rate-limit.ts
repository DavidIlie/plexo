const globalForRateLimit = globalThis as unknown as {
   __plexoRateLimit?: Map<string, { count: number; resetAt: number }>;
};

const hits = (globalForRateLimit.__plexoRateLimit ??= new Map<
   string,
   { count: number; resetAt: number }
>());

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;

export const checkRateLimit = (key: string): { allowed: boolean; remaining: number } => {
   const now = Date.now();
   const entry = hits.get(key);

   if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return { allowed: true, remaining: MAX_REQUESTS - 1 };
   }

   entry.count++;
   const remaining = Math.max(0, MAX_REQUESTS - entry.count);

   if (entry.count > MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
   }

   return { allowed: true, remaining };
};

export const getRateLimitStats = () => {
   const now = Date.now();
   const active: Array<{ key: string; count: number; remaining: number; resetsIn: number }> = [];

   for (const [key, entry] of hits.entries()) {
      if (now < entry.resetAt) {
         active.push({
            key: key.replace("trpc:", ""),
            count: entry.count,
            remaining: Math.max(0, MAX_REQUESTS - entry.count),
            resetsIn: Math.round((entry.resetAt - now) / 1000),
         });
      }
   }

   return active.sort((a, b) => b.count - a.count);
};
