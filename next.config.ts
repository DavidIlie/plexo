import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: "standalone",
   cacheComponents: true,
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
   ...(process.env.CACHE_DRIVER === "redis"
      ? {
           cacheHandlers: {
              default: require.resolve("./cache-handlers/remote-handler.mjs"),
              remote: require.resolve("./cache-handlers/remote-handler.mjs"),
           },
        }
      : {}),
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
