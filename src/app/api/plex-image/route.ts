import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

const imageCache = new Map<string, { buffer: ArrayBuffer; contentType: string; cachedAt: number }>();
const IMAGE_CACHE_TTL = 24 * 60 * 60 * 1000;

export const GET = async (req: NextRequest) => {
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
            "Cache-Control": "public, max-age=86400, immutable",
         },
      });
   }

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
      return NextResponse.json(
         { error: "Failed to fetch image" },
         { status: response.status },
      );
   }

   const buffer = await response.arrayBuffer();
   const contentType = response.headers.get("content-type") ?? "image/jpeg";

   imageCache.set(cacheKey, { buffer, contentType, cachedAt: Date.now() });

   return new NextResponse(buffer, {
      headers: {
         "Content-Type": contentType,
         "Cache-Control": "public, max-age=86400, immutable",
      },
   });
};

export const dynamic = "force-dynamic";
