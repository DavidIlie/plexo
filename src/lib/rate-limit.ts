const hits = new Map<string, { count: number; resetAt: number }>();

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
