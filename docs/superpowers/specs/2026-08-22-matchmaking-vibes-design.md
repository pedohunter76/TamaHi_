# Matchmaking & Vibes — Design Spec (Phase 3)

Date: 2026-08-22
Status: Approved by partner
Builds on: `2026-08-22-quiz-auth-design.md` (entry gate shipped)

## Decisions (partner-approved)

1. **Batch groups**: freshies wait in a queue; when 4 are collected, one room opens for that batch.
2. **Personality matching**: each freshie answers **all 12 vibe questions** (one-time setup, immediately after passing the FEU quiz). Batch formation prefers answer similarity.
3. **Batch size**: exactly **4** per room.
4. **Anti-stall rule**: the **longest-waiting** queued freshie always seeds the next batch once ≥4 people are queued; their top-3 matches by similarity fill the seats. Nobody waits forever.
5. Free tier only; no cron jobs; Realtime subscriptions must unsubscribe in effect cleanup.

## Flow

```
/login step 4 "Vibes" (after FEU quiz pass, same session)   ──┐
                                                            ├──> /lobby
Existing accounts without vibes: lobby shows setup card   ──┘
/lobby idle: [Find my people] button
  -> queued: live counter "N of 4 waiting" + [Leave queue]
  -> batch opens: all four auto-redirect to /chat/[roomId]
/chat/[roomId]: member-only landing listing batchmates' nicknames,
  note that messaging arrives in Phase 4
```

## Matching algorithm

- Score(pair) = count of identical answers across the 12 vibe slots.
- Trigger: after every successful queue insert, the joining client invokes the matcher server action.
- Algorithm (Node): pick oldest `joined_at` entry W; rank remaining entries by (score vs W desc, joined_at asc); group = W + top 3. Call `open_batch_room(group_ids)`:
  - plpgsql `security definer`, takes `uuid[4]`;
  - `pg_advisory_xact_lock(hash('match_queue'))` serializes concurrent matches;
  - re-verifies all four still queued; creates `rooms` row (defaults give 24h expiry);
    inserts `room_members` for all four; deletes their `match_queue` rows; returns room id;
  - if any seat vanished mid-flight, raises (client treats as "still waiting", UI retries naturally on next join).
- Leftover <4 entries remain queued for future batches.

## Data model (migration 003)

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

create function public.open_batch_room(p_members uuid[])
returns uuid ... -- body per Matching algorithm section
```

`profiles.vibes` readable via existing world-readable profiles policy — required so any joiner's client can compute scores.

## Client architecture

- **Zustand store** (`store/queue-store.ts`, first store): `status` (`idle | joining | waiting | matched`), `queueCount`, actions wrapping the server actions.
- **Realtime**: lobby subscribes to postgres_changes on `match_queue` for the live counter; subscription torn down in effect cleanup (house rule). Match detection: own `room_members` insert event, else refetch fallback poll every 10 s.
- **Server actions** (`lib/match/actions.ts`): `joinQueue()`, `leaveQueue()`, `checkMatch()` (returns `{ roomId } | null`), `getQueueState()`.
- **Constants**: `BATCH_SIZE = 4`, `VIBE_COUNT = 12`; `NEXT_PUBLIC_BATCH_SIZE` env override allowed solely for local verification.

## Vibe question pool (canonical, order fixed)

> **Revision (2026-08-22, partner directive):** pool replaced — now exactly **5** Taglish campus-life questions authored by the partner (vacant-period whereabouts, 2-hour-gap habits, after-class eats, absent-prof move, post-last-class plans). `VIBE_COUNT = 5`; legacy length-12 vibes arrays are treated as missing so accounts re-run setup.

The questions approved verbatim by partner. Stored in `lib/vibes/questions.ts` as plain data; option index = stored value 0–3.

## Guards & edge cases

- Lobby requires passed quiz AND vibes set; missing vibes renders inline setup card (covers pre-vibes legacy accounts).
- `/chat/[roomId]`: proxy guards unauthenticated; page verifies membership via `room_members` select policy (non-members see not-found).
- Leaving queue deletes own row; leaving while matched is harmless (row already gone).
- Expired rooms stay invisible via existing virtual-deletion RLS.

## Out of scope (Phase 4+)

Messaging/realtime chat inside rooms, strand_or_institute-based matching, rematch after room expiry, blocking/reporting.

## Verification

`tsc --noEmit`, lint, build green; manual multi-account walkthrough: two real guest accounts plus `NEXT_PUBLIC_BATCH_SIZE=2` local run to exercise batch opening, plus one deliberate mismatch run confirming the anti-stall rule.
