import { NextResponse } from "next/server";
import { invalidateAll } from "~/lib/cache";

export const POST = () => {
   invalidateAll();
   return NextResponse.json({ success: true });
};

export const dynamic = "force-dynamic";
