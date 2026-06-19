import type { NextConfig } from "next";

// Cache backend selection (see src/env.ts CACHE_DRIVER). Read from process.env
// directly because next.config runs outside the validated env module. Redis is
// only wired when explicitly selected AND a URL is provided; otherwise Next
// falls back to its built-in in-memory LRU for `use cache: remote`.
const useRedis =
   process.env.CACHE_DRIVER === "redis" && Boolean(process.env.REDIS_URL);

if (process.env.CACHE_DRIVER === "redis" && !process.env.REDIS_URL) {
   console.warn(
      "[cache] CACHE_DRIVER=redis but REDIS_URL is unset — falling back to the in-memory cache handler.",
   );
}

const nextConfig: NextConfig = {
   output: "standalone",
   cacheComponents: true,
   compiler: {
      removeConsole:
         process.env.NODE_ENV === "production"
            ? {
                 exclude: ["error", "warn"],
              }
            : false,
   },
   cacheLife: {
      library: { stale: 300, revalidate: 3600, expire: 7200 },
      metadata: { stale: 300, revalidate: 1800, expire: 3600 },
      analytics: { stale: 300, revalidate: 900, expire: 1800 },
      activity: { stale: 300, revalidate: 300, expire: 600 },
   },
   // Env-gated at the config layer: when Redis is not selected we register NO
   // remote handler and Next uses its built-in in-memory LRU.
   ...(useRedis
      ? {
           cacheHandlers: {
              remote: require.resolve("./cache-handlers/remote-handler.mjs"),
           },
        }
      : {}),
   experimental: {
      optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
   },
   images: {
      formats: ["image/avif", "image/webp"],
      remotePatterns: [
         {
            protocol: "https",
            hostname: "plex.davidhome.ro",
         },
         {
            protocol: "https",
            hostname: "image.tmdb.org",
         },
      ],
   },
   serverExternalPackages: ["@takumi-rs/image-response", "redis"],
};

export default nextConfig;
