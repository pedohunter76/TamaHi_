"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfile } from "@/lib/quiz/actions";
import {
  INSTITUTES,
  findInstitute,
} from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/client";

export type ProfileFormValues = {
  studentNumber: string;
  nickname: string;
  age: string;
  institute: string;
  course: string;
};

const selectClass =
  "input-glow h-auto w-full min-w-0 appearance-none rounded-lg px-4 py-3.5 pr-10 text-base text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function ProfileForm({
  initial,
  submitLabel,
  ensureSession,
  onSaved,
}: {
  initial?: Partial<ProfileFormValues>;
  submitLabel: string;
  ensureSession?: boolean;
  onSaved?: () => void;
}) {
  const [studentNumber, setStudentNumber] = useState(
    initial?.studentNumber ?? "",
  );
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [age, setAge] = useState(initial?.age ?? "");
  const [institute, setInstitute] = useState(initial?.institute ?? "");
  const [course, setCourse] = useState(initial?.course ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedCourses = institute
    ? (findInstitute(institute)?.courses ?? [])
    : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAge = Number(age);

    if (!studentNumber.trim()) {
      setError("Enter your student number.");
      return;
    }
    if (!nickname.trim()) {
      setError("Pick a nickname.");
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 15 || parsedAge > 99) {
      setError("Enter a valid age (15-99).");
      return;
    }
    if (!institute) {
      setError("Choose your institute.");
      return;
    }
    if (!course) {
      setError("Choose your course.");
      return;
    }

    setPending(true);
    try {
      if (ensureSession) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const { error: anonError } =
            await supabase.auth.signInAnonymously();
          if (anonError) throw new Error(anonError.message);
        }
      }

      await saveProfile({
        studentNumber: studentNumber.trim(),
        nickname: nickname.trim(),
        age: parsedAge,
        institute,
        course,
      });
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not save your profile. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  const inputClass = "flex flex-col gap-2";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className={inputClass}>
        <Label htmlFor="profile-student-number">Student number</Label>
        <Input
          id="profile-student-number"
          className="h-auto input-glow rounded-lg px-4 py-3.5 text-base"
          placeholder="e.g., 2026017871"
          value={studentNumber}
          onChange={(event) => setStudentNumber(event.target.value)}
          required
          maxLength={24}
        />
      </div>

      <div className={inputClass}>
        <Label htmlFor="profile-nickname">Nickname</Label>
        <Input
          id="profile-nickname"
          className="h-auto input-glow rounded-lg px-4 py-3.5 text-base"
          placeholder="What should classmates call you?"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
          maxLength={20}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className={inputClass}>
          <Label htmlFor="profile-age">Age</Label>
          <Input
            id="profile-age"
            className="h-auto input-glow rounded-lg px-4 py-3.5 text-base"
            type="number"
            inputMode="numeric"
            min={15}
            max={99}
            placeholder="18"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            required
          />
        </div>

        <div className={`${inputClass} min-w-0`}>
          <Label htmlFor="profile-institute">Institute</Label>
          <div className="relative">
            <select
              id="profile-institute"
              value={institute}
              onChange={(event) => {
                setInstitute(event.target.value);
                setCourse("");
              }}
              required
              className={selectClass}
            >
              <option value="" disabled>
                Select your institute…
              </option>
              {INSTITUTES.map((option) => (
                <option key={option.shortName} value={option.fullName}>
                  {option.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
          </div>
        </div>
      </div>

      <div className={inputClass}>
        <Label htmlFor="profile-course">Course</Label>
        <select
          id="profile-course"
          value={course}
          onChange={(event) => setCourse(event.target.value)}
          required
          disabled={!institute}
          className={selectClass}
        >
          <option value="" disabled>
            {institute ? "Select your course…" : "Pick an institute first"}
          </option>
          {selectedCourses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-auto rounded-lg py-4 text-sm font-bold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        {pending ? "Saving…" : submitLabel}
        <ArrowRight className="size-5 text-secondary" />
      </Button>
    </form>
  );
}

