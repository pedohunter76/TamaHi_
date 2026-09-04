import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("quiz_passed_at, nickname, vibes")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.quiz_passed_at && profile?.nickname) {
      redirect("/lobby");
    }
  }

  redirect("/login");
}

