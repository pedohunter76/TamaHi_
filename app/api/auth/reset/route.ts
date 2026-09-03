import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        await supabase.rpc("user_quit_and_reset", { p_user_id: user.id });
      } catch {
        await Promise.allSettled([
          supabase.from("room_members").delete().eq("user_id", user.id),
          supabase.from("match_queue").delete().eq("user_id", user.id),
        ]);
      }
    }

    await supabase.auth.signOut();
  } catch {
    // ignore sign out error
  }

  const response = NextResponse.redirect(new URL("/login", request.url));

  // Delete all cookies
  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
