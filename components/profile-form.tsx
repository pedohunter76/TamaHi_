"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  IdCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INSTITUTES,
  findInstitute,
  getInstituteShortName,
} from "@/lib/profile/constants";
import { saveProfile } from "@/lib/quiz/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type ProfileFormValues = {
  studentNumber: string;
  nickname: string;
  age: string;
  institute: string;
  course: string;
};

const selectClass =
  "h-12 w-full appearance-none rounded-xl border border-[#e5e7eb] bg-white px-4 pr-10 text-sm font-medium text-foreground transition-all focus:border-[#006633] focus:outline-none focus:ring-2 focus:ring-[#006633]/15 disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:opacity-60";

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

  const selectedInstituteObj = institute ? findInstitute(institute) : null;
  const selectedCourses = selectedInstituteObj?.courses ?? [];
  const instShort = getInstituteShortName(institute);
  const initialLetter = (nickname.trim() || "T").slice(0, 1).toUpperCase();

  const parsedAge = Number(age);
  const isStudentNumberValid =
    studentNumber.trim().length > 0 && studentNumber.trim().length <= 24;
  const isNicknameValid =
    nickname.trim().length > 0 && nickname.trim().length <= 20;
  const isAgeValid =
    Number.isInteger(parsedAge) && parsedAge >= 15 && parsedAge <= 99;
  const isInstituteValid = Boolean(institute);
  const isCourseValid = Boolean(course);

  const completedChecksCount = [
    isStudentNumberValid,
    isNicknameValid,
    isAgeValid,
    isInstituteValid,
    isCourseValid,
  ].filter(Boolean).length;
  const isAllValid = completedChecksCount === 5;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!studentNumber.trim()) {
      setError("Enter your student number (honor system).");
      return;
    }
    if (!nickname.trim()) {
      setError("Pick a nickname classmates can call you.");
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 15 || parsedAge > 99) {
      setError("Enter a valid age (15-99).");
      return;
    }
    if (!institute) {
      setError("Choose your FEU institute.");
      return;
    }
    if (!course) {
      setError("Choose your course program.");
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Enhanced Live Badge Card Preview */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#006633]/25 bg-gradient-to-br from-[#f0faf5] via-white to-[#f5fbf7] p-4 shadow-card-sm transition-all">
        {/* Card Header with Realtime Indicator */}
        <div className="flex items-center justify-between border-b border-[#006633]/15 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#006633]">
            <Sparkles className="size-3.5 text-[#FDB913]" />
            <span>Live Tamaraw Pass</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                isAllValid
                  ? "bg-[#16a34a] animate-pulse"
                  : "bg-[#FDB913] animate-pulse",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-bold",
                isAllValid ? "text-[#16a34a]" : "text-[#006633]",
              )}
            >
              {isAllValid ? "✓ Ready to Match" : `${completedChecksCount}/5 Verified`}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex size-13 shrink-0 items-center justify-center rounded-2xl border-2 border-[#FDB913] bg-[#006633] text-xl font-black text-white shadow-xs">
            {initialLetter}
            <span className="absolute -bottom-1 -right-1 rounded-full bg-[#FDB913] px-1 py-0.2 text-[8px] font-black uppercase text-[#006633] shadow-xs">
              FEU
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-black text-foreground">
                {nickname.trim() || "Your Freshie Nickname"}
              </span>

              {instShort ? (
                <span className="shrink-0 rounded-md border border-[#006633]/20 bg-[#006633]/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#006633]">
                  {instShort}
                </span>
              ) : null}

              {isAgeValid ? (
                <span className="shrink-0 rounded-md border border-[#e5e7eb] bg-white px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                  {parsedAge} y/o
                </span>
              ) : null}
            </div>

            <p className="truncate text-xs font-semibold text-foreground/80">
              {course ||
                (selectedInstituteObj
                  ? `${selectedInstituteObj.shortName} Freshie`
                  : "Far Eastern University Freshie")}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium">
                <IdCard className="size-3 text-[#006633]" />
                {studentNumber.trim() ? (
                  <span className="font-mono font-bold text-foreground">
                    SN: {studentNumber.trim()}
                  </span>
                ) : (
                  <span className="italic text-muted-foreground/70">
                    No student no. yet
                  </span>
                )}
              </span>

              <span className="inline-flex items-center gap-0.5 text-[#006633]">
                <ShieldCheck className="size-3 text-[#006633]" />
                <span>Honor System</span>
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Checklist Chips */}
        <div className="flex flex-wrap gap-1.5 border-t border-[#006633]/10 pt-2.5">
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
              isStudentNumberValid
                ? "bg-[#e7f7ed] text-[#006633] border border-[#006633]/20"
                : "bg-muted/60 text-muted-foreground border border-transparent",
            )}
          >
            {isStudentNumberValid ? (
              <Check className="size-2.5 stroke-[3] text-[#16a34a]" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            )}
            <span>Student No.</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
              isNicknameValid
                ? "bg-[#e7f7ed] text-[#006633] border border-[#006633]/20"
                : "bg-muted/60 text-muted-foreground border border-transparent",
            )}
          >
            {isNicknameValid ? (
              <Check className="size-2.5 stroke-[3] text-[#16a34a]" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            )}
            <span>Nickname</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
              isAgeValid
                ? "bg-[#e7f7ed] text-[#006633] border border-[#006633]/20"
                : "bg-muted/60 text-muted-foreground border border-transparent",
            )}
          >
            {isAgeValid ? (
              <Check className="size-2.5 stroke-[3] text-[#16a34a]" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            )}
            <span>Age</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
              isInstituteValid
                ? "bg-[#e7f7ed] text-[#006633] border border-[#006633]/20"
                : "bg-muted/60 text-muted-foreground border border-transparent",
            )}
          >
            {isInstituteValid ? (
              <Check className="size-2.5 stroke-[3] text-[#16a34a]" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            )}
            <span>Institute</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
              isCourseValid
                ? "bg-[#e7f7ed] text-[#006633] border border-[#006633]/20"
                : "bg-muted/60 text-muted-foreground border border-transparent",
            )}
          >
            {isCourseValid ? (
              <Check className="size-2.5 stroke-[3] text-[#16a34a]" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
            )}
            <span>Program</span>
          </div>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Student Number */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="profile-student-number"
              className="flex items-center gap-1 text-xs font-bold text-foreground"
            >
              <span>Student Number</span>
              {isStudentNumberValid ? (
                <Check className="size-3 text-[#16a34a]" />
              ) : null}
            </Label>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Honor System
            </span>
          </div>
          <Input
            id="profile-student-number"
            className="h-12 rounded-xl bg-white text-xs font-medium"
            placeholder="e.g., 2026123456"
            value={studentNumber}
            onChange={(event) => setStudentNumber(event.target.value)}
            required
            maxLength={24}
          />
        </div>

        {/* Nickname */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="profile-nickname"
              className="flex items-center gap-1 text-xs font-bold text-foreground"
            >
              <span>Freshie Nickname</span>
              {isNicknameValid ? (
                <Check className="size-3 text-[#16a34a]" />
              ) : null}
            </Label>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Classmate display
            </span>
          </div>
          <Input
            id="profile-nickname"
            className="h-12 rounded-xl bg-white text-xs font-medium"
            placeholder="What should batchmates call you?"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
            maxLength={20}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[110px_minmax(0,1fr)]">
        {/* Age */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="profile-age"
            className="flex items-center gap-1 text-xs font-bold text-foreground"
          >
            <span>Age</span>
            {isAgeValid ? <Check className="size-3 text-[#16a34a]" /> : null}
          </Label>
          <Input
            id="profile-age"
            className="h-12 rounded-xl bg-white text-xs font-medium"
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

        {/* Institute */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <Label
            htmlFor="profile-institute"
            className="flex items-center gap-1 text-xs font-bold text-foreground"
          >
            <span>Institute</span>
            {isInstituteValid ? (
              <Check className="size-3 text-[#16a34a]" />
            ) : null}
          </Label>
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
                  {option.shortName} — {option.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Course Program */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="profile-course"
            className="flex items-center gap-1 text-xs font-bold text-foreground"
          >
            <span>Degree Program / Course</span>
            {isCourseValid ? (
              <Check className="size-3 text-[#16a34a]" />
            ) : null}
          </Label>
          {selectedCourses.length > 0 ? (
            <span className="text-[10px] font-semibold text-[#006633]">
              {selectedCourses.length} programs available
            </span>
          ) : null}
        </div>
        <div className="relative">
          <select
            id="profile-course"
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            required
            disabled={!institute}
            className={selectClass}
          >
            <option value="" disabled>
              {institute
                ? "Select your specific program…"
                : "Pick an institute first"}
            </option>
            {selectedCourses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center text-xs font-bold text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-[#006633] text-sm font-extrabold text-[#FDB913] shadow-cta transition-all duration-300 hover:scale-[1.01] hover:bg-[#004d26]"
      >
        {pending ? "Saving profile…" : submitLabel}
        <ArrowRight className="ml-1.5 size-4 text-[#FDB913]" />
      </Button>
    </form>
  );
}
