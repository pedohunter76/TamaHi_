-- Migration 011: Room leaves tracking, preventing room rejoining, and leave announcement
-- Ensures freshies can leave rooms at will without being able to rejoin the same room,
-- while the chat continues uninterrupted for remaining room members.

-- 1. Create table to permanently log room departures
create table if not exists public.room_leaves (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  left_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists room_leaves_user_idx
  on public.room_leaves (user_id);

alter table public.room_leaves enable row level security;

drop policy if exists "Room leaves are viewable by authenticated users" on public.room_leaves;
create policy "Room leaves are viewable by authenticated users"
  on public.room_leaves for select to authenticated using (true);

drop policy if exists "Users record their own room departure" on public.room_leaves;
create policy "Users record their own room departure"
  on public.room_leaves for insert to authenticated with check (auth.uid() = user_id);

-- 2. Drop the unsafe client-side direct insert policy on room_members
-- Room members can ONLY be seated atomically via open_batch_room RPC.
drop policy if exists "Users join active rooms as themselves" on public.room_members;

-- 3. Update leave_room_and_cleanup to record departure, post departure notification, and retain room for remaining peers
create or replace function public.leave_room_and_cleanup(p_user_id uuid, p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining_members integer;
  v_nickname text;
begin
  -- Record departure in room_leaves so this user can never rejoin this room
  insert into public.room_leaves (room_id, user_id, left_at)
  values (p_room_id, p_user_id, now())
  on conflict (room_id, user_id) do update set left_at = now();

  -- Delete from active room members
  delete from public.room_members where room_id = p_room_id and user_id = p_user_id;

  -- Announce departure to remaining room members via chat message
  select nickname into v_nickname from public.profiles where id = p_user_id;
  if v_nickname is null or trim(v_nickname) = '' then
    v_nickname := 'A freshie';
  end if;

  insert into public.messages (room_id, user_id, content)
  values (p_room_id, p_user_id, '👋 ' || v_nickname || ' has left the batch room.');

  -- Check if any freshies are still in the room; only delete room when 0 members remain
  select count(*) into v_remaining_members from public.room_members where room_id = p_room_id;

  if v_remaining_members = 0 then
    delete from public.rooms where id = p_room_id;
  end if;
end;
$$;

-- 4. Update get_user_active_room to exclude any rooms the user has departed
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
    and not exists (
      select 1 from public.room_leaves rl
      where rl.room_id = rm.room_id and rl.user_id = p_user_id
    )
  order by rm.joined_at desc
  limit 1;
$$;
