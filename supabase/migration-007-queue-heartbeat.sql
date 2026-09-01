-- Heartbeat must not destroy queue fairness: joined_at keeps the original
-- join time (used for "longest-waiting queuer" seeding), last_seen_at is the
-- liveness signal used by purge_stale_queue.

alter table public.match_queue
  add column if not exists last_seen_at timestamptz not null default now();

create or replace function public.purge_stale_queue()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.match_queue
  where last_seen_at < now() - interval '3 minutes';
$$;
