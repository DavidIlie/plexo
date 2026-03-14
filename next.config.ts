import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: "standalone",
   compiler: {
      removeConsole:
         process.env.NODE_ENV === "production"
            ? {
                 exclude: ["error", "warn"],
              }
            : false,
   },
   experimental: {
      optimizePackageImports: [
         "lucide-react",
         "date-fns",
         "recharts",
      ],
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
   serverExternalPackages: ["@takumi-rs/image-response"],
};

export default nextConfig;
