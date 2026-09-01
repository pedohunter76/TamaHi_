# Matchmaking & Vibes Implementation Plan (Phase 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Personality-based matchmaking: 12-question vibe setup after the FEU quiz, a live lobby queue, and atomic batch seating of 4 freshies into a room.

**Architecture:** Queue rows in `match_queue`; the joining client runs a greedy oldest-seeds matcher over queue+vibes and seats via one security-definer DB function; Zustand store drives lobby UI with a realtime counter plus polling fallback.

**Tech Stack:** Next.js 16 App Router, TypeScript, @supabase/ssr, Zustand, shadcn/ui (nova), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-22-matchmaking-vibes-design.md`

## Global Constraints

- **Supabase FREE tier only.** No cron, no compute add-ons; Realtime subscriptions must unsubscribe in effect cleanup.
- Not a git repository — no commit steps; each task ends in its own verification command.
- No test framework installed — verification is `npx.cmd tsc --noEmit` + `npm.cmd run lint` (+ `npm.cmd run build` at the end) + manual walkthrough.
- `npm.cmd` / `npx.cmd` on PowerShell.
- Minimalistic UI; pages render inside global `PageShell`; `"use client"` only where interactive.

---

### Task 1: Migration 003 — vibes column, match_queue, open_batch_room

**Files:**
- Create: `supabase/migration-003-matchmaking.sql`
- Modify: `supabase/schema.sql` (append end-state equivalents)

**Interfaces:**
- Produces: `profiles.vibes smallint[]`, table `public.match_queue(user_id, joined_at)` with 3 RLS policies, `public.open_batch_room(p_members uuid[]) returns uuid`.

- [ ] **Step 1: Write migration file**

```sql
alter table public.profiles add column if not exists vibes smallint[];

create table public.match_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table public.match_queue enable row level security;

create policy "Queue is viewable while waiting"
  on public.match_queue for select to authenticated using (true);

create policy "Freshies join the queue as themselves"
  on public.match_queue for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Freshies leave the queue themselves"
  on public.match_queue for delete to authenticated
  using (auth.uid() = user_id);

create or replace function public.open_batch_room(p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('match_queue'));

  if array_length(p_members, 1) <> 4 then
    raise exception 'batch size must be exactly 4';
  end if;

  if (
    select count(*) from public.match_queue
    where user_id = any(p_members)
  ) <> 4 then
    raise exception 'batch members are no longer all queued';
  end if;

  insert into public.rooms default values
  returning id into v_room_id;

  insert into public.room_members (room_id, user_id)
  select v_room_id, m
  from unnest(p_members) as m;

  delete from public.match_queue where user_id = any(p_members);

  return v_room_id;
end;
$$;
```

Note: `insert into public.rooms default values` works because every column has a default (`id` via `gen_random_uuid()`, `expires_at` via `now() + interval '24 hours'`).

- [ ] **Step 2:** Append to `supabase/schema.sql`: same `vibes smallint[]` line inside/after the profiles definition (add column to its `create table` block), the `match_queue` create + RLS block verbatim from Step 1, and the identical `open_batch_room` function after the existing `handle_new_user` trigger section.

- [ ] **Step 3: Verify** — read both files back; SQL-only change, no compile impact.

### Task 2: Vibe question pool

**Files:**
- Create: `lib/vibes/questions.ts`

**Interfaces:**
- Produces: `VIBE_QUESTIONS: readonly { id: string; question: string; options: readonly string[] }[]` (exactly 12, order fixed); `VIBE_COUNT = 12`.

- [ ] **Step 1: Write pool** (verbatim partner-approved questions q01–q12 from spec §Vibe question pool; ids `v01..v12`; each entry exactly 4 options).

```ts
export type VibeQuestion = {
  id: string;
  question: string;
  options: readonly string[];
};

export const VIBE_COUNT = 12;

export const VIBE_QUESTIONS: readonly VibeQuestion[] = [
  // v01..v12 — the approved 12 questions, options in listed order
];
```

- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit`

### Task 3: Pure grouping logic

**Files:**
- Create: `lib/match/group.ts`

**Interfaces:**
- Produces:
  - `scorePair(a: number[], b: number[]): number`
  - `pickBatch(entries: QueueEntry[], batchSize: number): string[] | null`
  - `type QueueEntry = { userId: string; joinedAt: number; vibes: number[] | null }`

- [ ] **Step 1: Implement**

```ts
export type QueueEntry = {
  userId: string;
  joinedAt: number;
  vibes: number[] | null;
};

export function scorePair(a: number[], b: number[]): number {
  let score = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) score++;
  }
  return score;
}

export function pickBatch(
  entries: QueueEntry[],
  batchSize: number,
): string[] | null {
  if (entries.length < batchSize) return null;

  const sorted = [...entries].sort((x, y) => x.joinedAt - y.joinedAt);
  const seed = sorted[0];

  const ranked = sorted
    .slice(1)
    .map((entry) => ({
      entry,
      score:
        seed.vibes && entry.vibes ? scorePair(seed.vibes, entry.vibes) : -1,
    }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.entry.joinedAt - b.entry.joinedAt,
    );

  return [
    seed.userId,
    ...ranked.slice(0, batchSize - 1).map((r) => r.entry.userId),
  ];
}
```

- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit`

### Task 4: Server actions

**Files:**
- Modify: `lib/quiz/actions.ts` — `completeQuiz(nickname: string, vibes: number[])` (validate `vibes.length === 12`, each 0–3; store both)
- Create: `lib/match/constants.ts` — `BATCH_SIZE = Number(process.env.NEXT_PUBLIC_BATCH_SIZE ?? 4)`
- Create: `lib/match/actions.ts` — `"use server"`

**Interfaces:**
- Consumes: `pickBatch` (Task 3), `BATCH_SIZE`.
- Produces:
  - `joinQueue(): Promise<void>`
  - `leaveQueue(): Promise<void>`
  - `getQueueState(): Promise<{ queued: boolean; count: number; roomId: string | null }>`
  - `tryMatch(): Promise<string | null>` (roomId when this caller's batch opened)

- [ ] **Step 1:** Extend `completeQuiz` signature + validation; update `.update({ nickname: trimmed, quiz_passed_at: ..., vibes })`.

- [ ] **Step 2: Implement match actions** — all use `requireUser()` pattern from quiz actions. `joinQueue`: upsert own row (`.upsert({ user_id: userId })`). `getQueueState`: count queue rows; check own latest `room_members` row whose room is unexpired (`select room_id from room_members where user_id = uid order by joined_at desc limit 1`) → `roomId`. `tryMatch`: fetch all queue entries ordered by `joined_at`, join `profiles.vibes` (`.select("user_id, joined_at")` + second profiles select for vibes of those ids), run `pickBatch(entries, BATCH_SIZE)`; if group exists → `supabase.rpc("open_batch_room", { p_members: group })` → return returned id if group includes caller, else null.

- [ ] **Step 3: Verify** — `npx.cmd tsc --noEmit`

### Task 5: Zustand queue store

**Files:**
- Run: `npm.cmd install zustand`
- Create: `store/queue-store.ts`

**Interfaces:**
- Consumes: Task 4 actions.
- Produces: `useQueueStore` with `{ status: "idle"|"joining"|"waiting"|"matched", roomId: string|null, queueCount: number, join(), leave(), refresh() }`.

- [ ] **Step 1: Implement store** — actions wrap server actions with try/catch setting `status` back on failure; `refresh()` reads `getQueueState()` and sets `matched`+`roomId` when present; `join()` calls `joinQueue()` then `tryMatch()` then `refresh()`.
- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit`

### Task 6: Login step 4 (vibes) + lobby rewrite

**Files:**
- Modify: `app/login/page.tsx` — add `"vibes"` to `Step` union between quiz and nickname (flow: number → quiz → vibes → nickname); render `VIBE_QUESTIONS` as single-select grids storing an index array; submit calls `completeQuiz(nickname… )` — reorder so nickname form comes last and passes collected vibes through.
- Modify: `app/lobby/page.tsx` — guard now also checks `profile.vibes`; missing vibes renders inline vibe-setup card reusing the same grid component; otherwise queue card driven by `useQueueStore`, realtime counter subscribed in `useEffect` with channel cleanup, 5 s `refresh()` interval fallback, matched → `router.push(/chat/${roomId})`.

**Interfaces:**
- Consumes: Tasks 2, 4, 5.
- Extract shared component `components/vibe-picker.tsx` used by both login and lobby card.

- [ ] **Step 1: vibe-picker component** — props `{ value: number[]; onChange(v: number[]) }`; renders numbered questions, option buttons highlight selected index.
- [ ] **Step 2: Login page changes** per above; STEP_TITLES gains `vibes: "What's your vibe?"`.
- [ ] **Step 3: Lobby rewrite** per above; keep existing greeting.
- [ ] **Step 4: Verify** — `npx.cmd tsc --noEmit` && `npm.cmd run lint`

### Task 7: Room landing stub `/chat/[roomId]`

**Files:**
- Create: `app/chat/[roomId]/page.tsx`

**Interfaces:**
- Consumes: SSR client; Next 16 async params (`PageProps<"/chat/[roomId]">`).

- [ ] **Step 1:** Await params; verify own membership + room unexpired via `room_members`/`rooms` select (non-member → `notFound()`); list co-members' nicknames from `profiles`; copy: messages arrive in Phase 4.
- [ ] **Step 2: Verify** — `npx.cmd tsc --noEmit`

### Task 8: Docs truthfulness + full verification

**Files:**
- Modify: `AGENTS.md` — Domain rules gain: batch of 4 seeded by longest waiter, similarity out of 12 vibes, atomic `open_batch_room`, queue state lives in Zustand.

- [ ] **Step 1:** AGENTS.md edit.
- [ ] **Step 2:** `npx.cmd tsc --noEmit` && `npm.cmd run lint` && `npm.cmd run build` (expect routes: `/`, `/lobby`, `/login`, `/chat/[roomId]`).
- [ ] **Step 3:** Restart dev server; clipboard migration-003 for partner.

### Task 9: Partner walkthrough (no code)

1. Run migration-003 (clipboard).
2. Fact-check nothing new (vibes already approved) — instead set `NEXT_PUBLIC_BATCH_SIZE=2` locally for the test, then two guest accounts queue simultaneously → both land in a room page listing each other.
3. Restore batch size 4; confirm idle lobby state.
