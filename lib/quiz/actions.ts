"use server";

import { findInstitute } from "@/lib/profile/constants";
import { requireUser } from "@/lib/supabase/require-user";
import { VIBE_COUNT } from "@/lib/vibes/questions";

export type ProfileInput = {
  studentNumber: string;
  nickname: string;
  age: number;
  institute: string;
  course: string;
};

function validateProfile(input: ProfileInput): string | null {
  const studentNumber = input.studentNumber.trim();
  if (!studentNumber || studentNumber.length > 24) {
    return "Student number must be 1-24 characters.";
  }

  const nickname = input.nickname.trim();
  if (!nickname || nickname.length > 20) {
    return "Nickname must be 1-20 characters.";
  }

  if (!Number.isInteger(input.age) || input.age < 15 || input.age > 99) {
    return "Age must be between 15 and 99.";
  }

  const institute = findInstitute(input.institute);
  if (!institute) {
    return "Pick your institute from the list.";
  }

  const course = input.course.trim();
  if (!course || course.length > 60) {
    return "Course must be 1-60 characters.";
  }

  if (!institute.courses.includes(course)) {
    return "Course must belong to your institute.";
  }

  return null;
}

export async function saveProfile(input: ProfileInput): Promise<void> {
  const validationError = validateProfile(input);

  if (validationError) {
    throw new Error(validationError);
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      student_number: input.studentNumber.trim(),
      nickname: input.nickname.trim(),
      age: input.age,
      institute: input.institute,
      course: input.course.trim(),
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeOnboarding(vibes: number[]): Promise<void> {
  if (
    vibes.length !== VIBE_COUNT ||
    vibes.some((v) => !Number.isInteger(v) || v < 0 || v > 3)
  ) {
    throw new Error("Invalid vibe answers");
  }

  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      quiz_passed_at: new Date().toISOString(),
      vibes,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
