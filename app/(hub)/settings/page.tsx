import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "@/components/profile-form";
import { VibeSetupCard } from "@/components/vibe-setup-card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("student_number, nickname, age, institute, course")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
          Settings
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Tune your profile and vibes. Changes apply to future matches — rooms
          you&apos;re already in stay as they are.
        </p>
      </section>

      <section className="glass-card flex flex-col gap-6 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold tracking-tight">Your profile</h2>
        <ProfileForm
          initial={{
            studentNumber: (profile?.student_number as string | null) ?? "",
            nickname: (profile?.nickname as string | null) ?? "",
            age:
              profile?.age != null && profile.age !== undefined
                ? String(profile.age)
                : "",
            institute: (profile?.institute as string | null) ?? "",
            course: (profile?.course as string | null) ?? "",
          }}
          submitLabel="Save changes"
        />
      </section>

      <section className="glass-card flex flex-col gap-4 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold tracking-tight">Your vibes</h2>
        <VibeSetupCard />
      </section>
    </div>
  );
}
