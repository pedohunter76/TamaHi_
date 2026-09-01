# Freshies Quiz Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace email authentication with a fun freshies-only gate: free-typed student number → 5/5 FEU quiz (reshuffled on fail) → chosen nickname → lobby.

**Architecture:** Supabase anonymous sessions provide real auth under the hood; the quiz pool lives server-only and grading happens in Server Actions so answers never reach the browser; existing proxy guard and RLS stay untouched.

**Tech Stack:** Next.js 16 App Router, TypeScript, @supabase/ssr, shadcn/ui (nova), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-22-quiz-auth-design.md`

## Global Constraints

- **Supabase FREE tier only.** Nothing requiring Pro, custom SMTP, or compute add-ons.
- Not a git repository — no commit steps; each task ends with its own verification command instead.
- No test framework installed — verification is `npx.cmd tsc --noEmit` + `npm.cmd run lint` + `npm.cmd run build` plus manual flow testing on the dev server.
- Use `npm.cmd` / `npx.cmd` in PowerShell (execution policy blocks `npm.ps1`).
- Minimalistic UI: typography and whitespace, no heavy visuals.
- Existing conventions: pages render inside global `PageShell`; `"use client"` only where genuinely interactive.

---

### Task 1: Database migration file + schema end-state

**Files:**
- Create: `supabase/migration-002-quiz-auth.sql`
- Modify: `supabase/schema.sql` (profiles table definition + trigger function)

**Interfaces:**
- Produces: `profiles.student_number text`, `profiles.nickname text`, `profiles.quiz_passed_at timestamptz`; nullable `profiles.email`; null-safe `handle_new_user()`.

- [ ] **Step 1: Write migration file**

```sql
alter table public.profiles alter column email drop not null;

alter table public.profiles
  add column if not exists student_number text,
  add column if not exists nickname text,
  add column if not exists quiz_passed_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;
```

- [ ] **Step 2: Update `supabase/schema.sql` to end-state**

In the `create table public.profiles` block: remove `not null` from `email`, add the three new columns (`student_number text`, `nickname text`, `quiz_passed_at timestamptz`). The trigger function body is already identical to the migration's version — no change needed there.

End-state table:

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  student_number text,
  nickname text,
  quiz_passed_at timestamptz,
  strand_or_institute text,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Verify**

Read both files back; confirm migration matches schema.sql end-state semantics. No compile impact.

### Task 2: Quiz pool (server-only data module)

**Files:**
- Create: `lib/quiz/pool.ts`

**Interfaces:**
- Produces: `QUIZ_POOL: readonly QuizItem[]` where `type QuizItem = { id: string; question: string; options: readonly string[]; answerIndex: number }`.

- [ ] **Step 1: Write the pool with `import "server-only"`**

```ts
import "server-only";

export type QuizItem = {
  id: string;
  question: string;
  options: readonly string[];
  answerIndex: number;
};

export const QUIZ_POOL: readonly QuizItem[] = [
  // 18 items — see question draft below; ids q01..q18
];
```

Question draft (partner fact-checks before ship):

| # | Question | Answer |
|---|----------|--------|
| q01 | Who founded FEU? | Nicanor Reyes Sr. |
| q02 | In what year was FEU founded? | 1928 |
| q03 | What is FEU's mascot? | Tamaraw |
| q04 | What are FEU's official colors? | Green and gold |
| q05 | Where is FEU's main campus located? | Sampaloc, Manila |
| q06 | The street fronting FEU, popularly "Morayta", is now named after whom? | Nicanor Reyes Sr. |
| q07 | Which athletic association is FEU part of? | UAAP |
| q08 | Which school is FEU's traditional "Battle of the East" rival? | University of the East |
| q09 | The tamaraw animal is endemic to which island? | Mindoro |
| q10 | Which National Artist designed FEU's Art Deco Administration Building? | Pablo Antonio |
| q11 | FEU's official student publication is called? | The Advocate |
| q12 | In FEU, what does IAS stand for? | Institute of Arts and Sciences |
| q13 | FEU's campus was heavily destroyed during which conflict? | World War II |
| q14 | Which FEU-affiliated school focuses on engineering and computing? | FEU Institute of Technology (FEU Tech) |
| q15 | The tamaraw belongs to which animal group? | Buffalo (bovine) family |
| q16 | FEU's varsity teams are collectively called? | Tamaraws |
| q17 | What does FEU stand for? | Far Eastern University |
| q18 | FEU men's basketball star Johnny Abarrientos' famous nickname? | The Flying A |

Each item gets 4 plausible options with the answer index randomized across positions.

- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit`

### Task 3: Quiz server actions

**Files:**
- Create: `lib/quiz/types.ts`
- Create: `lib/quiz/actions.ts`

**Interfaces:**
- Consumes: `QUIZ_POOL` from Task 2.
- Produces:
  - `drawQuiz(): Promise<PublicQuizQuestion[]>` (5 random, answers stripped)
  - `gradeQuiz(answers: Record<string, number>): Promise<{ passed: boolean; correctCount: number }>`
  - `saveStudentNumber(value: string): Promise<void>`
  - `completeQuiz(nickname: string): Promise<void>` (sets `nickname` + `quiz_passed_at = new Date()`)

- [ ] **Step 1: types.ts**

```ts
export type PublicQuizQuestion = {
  id: string;
  question: string;
  options: readonly string[];
};

export type GradeResult = {
  passed: boolean;
  correctCount: number;
};
```

- [ ] **Step 2: actions.ts** — `"use server"` directive; helpers pick 5 random distinct pool items (Fisher–Yates slice), strip `answerIndex`; mutations get the SSR client (`@/lib/supabase/server`), require `user`, update own row (`eq("id", user.id)`); `completeQuiz` validates nickname trimmed length 1–20.

- [ ] **Step 3: Verify** — `npx.cmd tsc --noEmit`

### Task 4: Three-step login page rewrite

**Files:**
- Modify (full rewrite): `app/login/page.tsx`

**Interfaces:**
- Consumes: all four actions from Task 3; `createClient()` from `lib/supabase/client`.

- [ ] **Step 1: Implement the state machine**

`"use client"` page; local state: `step: "number" | "quiz" | "nickname"`, `questions`, `selections`, `score`, `error`, `pending`.
- Step 1 submit: trim value, require 1–24 chars → `signInAnonymously()` **only if no active session** (`getUser()` first — avoids stacking guest users on retries) → `saveStudentNumber(value)` → `setStep("quiz")` + `drawQuiz()`.
- Step 2 submit: all 5 answered required → `gradeQuiz()`; pass → step 3; fail → show `correctCount`/5 + "Try again" re-draws (`drawQuiz()`, clear selections).
- Step 3 submit: `completeQuiz(nickname)` → `router.replace("/lobby")` + `router.refresh()`.
- Copy: playful freshies tone ("Prove you belong at FEU 🐾"-style, minimal emoji per house rules: none).
- Minimal UI: numbered step indicator as plain text, shadcn Input/Button/RadioGroup-free selection via bordered buttons grid (no new deps).

- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit` + `npm.cmd run lint`

### Task 5: Lobby quiz-passed guard

**Files:**
- Modify: `app/lobby/page.tsx`

- [ ] **Step 1: Guard + greeting**

After `getUser()`: query `profiles` for `nickname`, `quiz_passed_at`; if missing row or `quiz_passed_at == null` → `redirect("/login")`. Greeting shows nickname when present, else generic.

- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit` + `npm.cmd run lint`

### Task 6: Cleanup + docs truthfulness

**Files:**
- Delete: `app/auth/callback/route.ts`
- Modify: `AGENTS.md` Domain rules section

- [ ] **Step 1:** Delete callback route (email links gone).
- [ ] **Step 2:** Replace the `@feu.edu.ph` regex domain rule with: entry gate = student number (unvalidated) + 5/5 server-graded FEU quiz; anonymous sessions; see spec path.
- [ ] **Step 3: Full verification** — `npx.cmd tsc --noEmit` && `npm.cmd run lint` && `npm.cmd run build`; expect `/lobby`, `/login` routes building clean, `/auth/callback` gone.

### Task 7: Partner setup + live walkthrough (no code)

Partner steps, guided click-by-click in chat:
1. Run `migration-002-quiz-auth.sql` (clipboard provided).
2. Dashboard → Authentication → Sign In / Providers → enable **Anonymous sign-in**.
3. Fact-check the 18 quiz questions (table above) — veto any wrong ones.
4. Walk the flow on http://localhost:3000/login: fail-on-purpose once, retry with new set, pass, pick nickname, land in `/lobby`.
