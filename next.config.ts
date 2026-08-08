import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: "standalone",
   cacheComponents: true,
   partialPrefetching: true,
   reactCompiler: true,
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
   cacheHandlers: {
      default: require.resolve("./cache-handlers/remote-handler.mjs"),
      remote: require.resolve("./cache-handlers/remote-handler.mjs"),
   },
   experimental: {
      // NOTE: recharts is NOT tree-shakeable in v3 (shared immer/redux store
      // couples every chart type into one chunk); listing it here is harmless
      // but ineffective. Route-level lazy loading (see lazy-charts.tsx) is the
      // real lever. lucide-react and date-fns do shake correctly.
      optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
      turbopackRustReactCompiler: true,
      useOffline: true,
      hideLogsAfterAbort: true,
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
   serverExternalPackages: ["@takumi-rs/image-response", "@redis/client"],
};

export default nextConfig;
