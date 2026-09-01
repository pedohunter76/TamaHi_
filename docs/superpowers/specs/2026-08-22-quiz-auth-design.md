# FEU Freshies Quiz Auth — Design Spec

Date: 2026-08-22
Status: Superseded in part — the FEU knowledge quiz was removed by partner directive after live testing; entry is now student number → vibes → nickname (see `2026-08-22-matchmaking-vibes-design.md`)
Replaces: Email OTP/link authentication from earlier Phase 2 work

## Context

Email-based auth hit a free-tier wall: Supabase locks email-template editing behind custom SMTP or Pro, so OTP codes could not be shown in emails. Partner decision: drop email entirely and gate entry with a fun 5-question FEU quiz, exclusively targeting freshmen ("freshies"). **Supabase FREE TIER ONLY is a hard constraint** (recorded in AGENTS.md).

## Requirements

1. Student number: typed freely, **no format validation** — any non-empty string up to 24 chars. It is stored as-is on the profile.
2. Verification = quiz only. 5 multiple-choice questions drawn randomly per attempt from a ~18-question pool.
3. Pass condition: **all 5 correct**. On failure: show score, deal 5 *new* random questions on retry.
4. After passing: user picks a **nickname** (duplicates allowed). Nickname is their display name in future chat phases.
5. Audience framing: freshies only (self-selected via student number + quiz; no registrar verification possible).
6. Free tier only: no paid features, no custom SMTP, no cron/compute add-ons.

## Architecture — Approach A: anonymous sessions + server-side grading

- Entering step 1 calls `supabase.auth.signInAnonymously()` (`@supabase/ssr` clients). This yields a real session, keeping the existing proxy route guard (`proxy.ts` → `lib/supabase/middleware.ts`) and all RLS intact.
- Quiz pool lives in a **server-only module** (`import "server-only"`). The browser never receives correct answers.
- A Server Action grades each attempt server-side and returns per-question correctness plus a fresh set of 5 on failure.
- Passing stamps `profiles.quiz_passed_at`; nickname step updates `profiles.nickname` via the existing own-row UPDATE policy.
- `/lobby` server component re-checks `quiz_passed_at` server-side so URL-editing cannot skip the quiz.

## Flow

```
/login
  ├─ Step 1: student number input (non-empty, ≤24 chars) → signInAnonymously()
  ├─ Step 2: 5 random MCQs → gradeQuiz() server action
  │     ├─ fail: show score → "Try again" draws new random 5
  │     └─ pass: Step 3
  └─ Step 3: nickname input (non-empty, ≤20 chars) → save profile → /lobby
```

Direct visits to `/lobby` with an unpassed profile redirect back to `/login`.

## Data changes

Migration file `supabase/migration-002-quiz-auth.sql` (partner runs it in the SQL Editor):

```sql
alter table public.profiles alter column email drop not null;

alter table public.profiles
  add column if not exists student_number text,
  add column if not exists nickname text,
  add column if not exists quiz_passed_at timestamptz;
```

The same migration file also contains `create or replace function public.handle_new_user()` so profile rows are created for guest users whose email is null.

Dashboard prerequisite (free tier, no cost): enable **Authentication → Sign In / Providers → Anonymous sign-in**, since `signInAnonymously()` fails while the provider is off.

Existing policies remain valid: guest users carry the `authenticated` role (with an `is_anonymous` flag), so all current RLS applies unchanged.

`schema.sql` updated to match end-state so fresh installs work in one run.

## Quiz content

~18 four-option MCQs about FEU (history, campus, identity: founder Nicanor Reyes Sr., founding year, Tamaraw mascot, green-and-gold, location, landmarks). Drafted during implementation and shown to the partner for fact-checking before shipping. Pool lives in code (no DB table needed).

## Cleanup

- Delete `app/auth/callback/route.ts` (no email links).
- Rewrite `app/login/page.tsx` as the 3-step flow.
- Update AGENTS.md domain rule referencing the `@feu.edu.ph` regex (obsolete).

## Out of scope (later phases)

Matchmaking queue, rooms UI, Realtime chat, sign-out button polish, rate limiting of quiz attempts.

## Testing

No test framework installed yet (per AGENTS.md). Verification: `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus manual end-to-end flow through the dev server (fail path included).
