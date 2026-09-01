"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import {
  ProfileForm,
  type ProfileFormValues,
} from "@/components/profile-form";

export function ProfileEditCard({
  initial,
}: {
  initial: Partial<ProfileFormValues>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Edit profile
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit your profile">
        <ProfileForm
          initial={initial}
          submitLabel="Save changes"
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </Modal>
    </>
  );
}
