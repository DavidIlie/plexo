import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: "standalone",
   cacheComponents: true,
   // Client navigation prefetch stack: prefetch only the App Shell (static
   // parts) on <Link> hover/viewport, then stream the dynamic holes. varyParams,
   // optimisticRouting and prefetchInlining already default on with
   // cacheComponents; appShells additionally requires cachedNavigations.
   partialPrefetching: true,
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
   // Always register the remote handler so `redis` is traced into the standalone
   // output and the backend can be toggled purely via runtime env (CACHE_DRIVER
   // / REDIS_URL). The handler module picks redis vs in-memory at load time —
   // config is frozen at build in standalone, so the choice can't live here.
   cacheHandlers: {
      remote: require.resolve("./cache-handlers/remote-handler.mjs"),
   },
   experimental: {
      optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
      appShells: true,
      cachedNavigations: true,
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
