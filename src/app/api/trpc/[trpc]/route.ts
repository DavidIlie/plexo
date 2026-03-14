import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { checkRateLimit } from "~/lib/rate-limit";

const createContext = async (req: NextRequest) => {
   return createTRPCContext({
      headers: req.headers,
   });
};

const handler = (req: NextRequest) => {
   const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
   const { allowed } = checkRateLimit(`trpc:${ip}`);

   if (!allowed) {
      return NextResponse.json(
         { error: "Too many requests. Please try again later." },
         { status: 429 },
      );
   }

   return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: () => createContext(req),
      onError:
         env.NODE_ENV === "development"
            ? ({ path, error }) => {
                 console.error(
                    `tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
                 );
              }
            : undefined,
   });
};

export { handler as GET, handler as POST };

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
