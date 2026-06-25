import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { env } from "~/env";
import { ALL_ROOTS, scope } from "~/lib/cache-tags";
import { getRateLimitStats } from "~/lib/rate-limit";

const isAuthorized = (req: NextRequest): boolean => {
   const token = req.headers.get("authorization")?.replace("Bearer ", "");
   return token === env.REFRESH_SECRET;
};

export const POST = async (req: NextRequest) => {
   if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const scopeParam = req.nextUrl.searchParams.get("scope");
   const hard = req.nextUrl.searchParams.get("hard") !== null;
   const profile: string | { expire: number } = hard ? { expire: 0 } : "max";

   let tags: readonly string[];
   if (scopeParam) {
      const root = scope(scopeParam);
      if (!root) {
         return NextResponse.json(
            { error: `Unknown scope "${scopeParam}"`, validScopes: ALL_ROOTS },
            { status: 400 },
         );
      }
      tags = [root];
   } else {
      tags = ALL_ROOTS;
   }

   for (const tag of tags) {
      revalidateTag(tag, profile);
   }

   return NextResponse.json({
      success: true,
      mode: hard ? "hard" : "soft",
      revalidated: tags,
   });
};

export const GET = async (req: NextRequest) => {
   if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   return NextResponse.json({
      handler:
         env.CACHE_DRIVER === "redis" && env.REDIS_URL ? "redis" : "memory",
      roots: ALL_ROOTS,
      rateLimits: getRateLimitStats(),
   });
};
