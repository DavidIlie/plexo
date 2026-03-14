import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { checkRateLimit } from "~/lib/rate-limit";

const MAX_IMAGE_CACHE_SIZE = 200;

const globalForImageCache = globalThis as unknown as {
   __plexoImageCache?: Map<string, { buffer: ArrayBuffer; contentType: string; cachedAt: number }>;
   __plexoImageInFlight?: Map<string, Promise<{ buffer: ArrayBuffer; contentType: string }>>;
};
const imageCache = (globalForImageCache.__plexoImageCache ??= new Map());
const imageInFlight = (globalForImageCache.__plexoImageInFlight ??= new Map());
const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000;

const evictOldestImages = () => {
   const evictCount = Math.ceil(MAX_IMAGE_CACHE_SIZE * 0.2);
   const sorted = [...imageCache.entries()].sort(
      (a, b) => a[1].cachedAt - b[1].cachedAt,
   );
   for (let i = 0; i < evictCount && i < sorted.length; i++) {
      imageCache.delete(sorted[i]![0]);
   }
};

export const GET = async (req: NextRequest) => {
   const { allowed } = checkRateLimit("image-proxy", 60 * 1000, 300);
   if (!allowed) {
      return NextResponse.json(
         { error: "Rate limit exceeded" },
         { status: 429 },
      );
   }

   const path = req.nextUrl.searchParams.get("path");
   const w = req.nextUrl.searchParams.get("w") ?? "300";
   const h = req.nextUrl.searchParams.get("h") ?? "450";

   if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
   }

   const cacheKey = `${path}:${w}:${h}`;
   const cached = imageCache.get(cacheKey);

   if (cached && Date.now() - cached.cachedAt < IMAGE_CACHE_TTL) {
      return new NextResponse(cached.buffer, {
         headers: {
            "Content-Type": cached.contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
         },
      });
   }

   // Deduplicate in-flight requests for the same image
   const existing = imageInFlight.get(cacheKey);
   if (existing) {
      const result = await existing;
      return new NextResponse(result.buffer, {
         headers: {
            "Content-Type": result.contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
         },
      });
   }

   const fetchPromise = (async () => {
      const url = new URL(
         `/photo/:/transcode?width=${w}&height=${h}&minSize=1&upscale=1&url=${encodeURIComponent(path)}`,
         env.PLEX_URL,
      );

      const response = await fetch(url.toString(), {
         headers: {
            "X-Plex-Token": env.PLEX_TOKEN,
         },
      });

      if (!response.ok) {
         throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") ?? "image/jpeg";

      imageCache.set(cacheKey, { buffer, contentType, cachedAt: Date.now() });

      if (imageCache.size > MAX_IMAGE_CACHE_SIZE) {
         evictOldestImages();
      }

      return { buffer, contentType };
   })();

   imageInFlight.set(cacheKey, fetchPromise);

   try {
      const result = await fetchPromise;
      return new NextResponse(result.buffer, {
         headers: {
            "Content-Type": result.contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
         },
      });
   } catch {
      return NextResponse.json(
         { error: "Failed to fetch image" },
         { status: 502 },
      );
   } finally {
      imageInFlight.delete(cacheKey);
   }
};

export const dynamic = "force-dynamic";
