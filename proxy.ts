import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/lobby/:path*",
    "/chat/:path*",
    "/members/:path*",
    "/groups/:path*",
    "/settings/:path*",
    "/login",
  ],
};

