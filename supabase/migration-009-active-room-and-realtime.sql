-- Migration 009: Fast active room lookup & match queue realtime publications

-- 1. Helper function to find a user's active unexpired room directly
create or replace function public.get_user_active_room(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select rm.room_id
  from public.room_members rm
  join public.rooms r on r.id = rm.room_id
  where rm.user_id = p_user_id
    and r.expires_at > now()
  order by rm.joined_at desc
  limit 1;
$$;

-- 2. Add match_queue and room_members to realtime publication for instant client matchmaking events
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_queue'
  ) then
    alter publication supabase_realtime add table public.match_queue;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_members'
  ) then
    alter publication supabase_realtime add table public.room_members;
  end if;
end $$;
