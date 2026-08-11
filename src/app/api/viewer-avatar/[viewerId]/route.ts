import { getViewerAvatar } from "~/server/cache/history";

export const GET = async (
   _request: Request,
   context: { params: Promise<{ viewerId: string }> },
) => {
   const { viewerId } = await context.params;
   const avatarUrl = await getViewerAvatar(viewerId);

   if (!avatarUrl) {
      return new Response(null, { status: 404 });
   }

   let upstream: Response;
   try {
      upstream = await fetch(avatarUrl, {
         next: { revalidate: 24 * 60 * 60 },
      });
   } catch {
      return new Response(null, { status: 502 });
   }
   if (!upstream.ok || !upstream.body) {
      return new Response(null, { status: 502 });
   }

   const contentType = upstream.headers.get("content-type");
   if (!contentType?.startsWith("image/")) {
      return new Response(null, { status: 502 });
   }

   return new Response(upstream.body, {
      headers: {
         "Content-Type": contentType,
         "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
         "X-Content-Type-Options": "nosniff",
      },
   });
};
