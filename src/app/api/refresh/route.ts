import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { invalidateAll, getCacheStats } from "~/lib/cache";

export const POST = async (req: NextRequest) => {
   const authHeader = req.headers.get("authorization");
   const token = authHeader?.replace("Bearer ", "");

   if (token !== env.REFRESH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   invalidateAll();
   return NextResponse.json({ success: true });
};

export const GET = async (req: NextRequest) => {
   const authHeader = req.headers.get("authorization");
   const token = authHeader?.replace("Bearer ", "");

   if (token !== env.REFRESH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   return NextResponse.json(getCacheStats());
};

export const dynamic = "force-dynamic";
