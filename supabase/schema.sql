-- ═══════════════════════════════════════════════════════════════
-- TamaHi! (FEU Group Chat) - Complete Idempotent Database Schema
-- Safe to run multiple times in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  student_number text,
  nickname text,
  age smallint,
  institute text,
  course text,
  quiz_passed_at timestamptz,
  vibes smallint[],
  created_at timestamptz not null default now()
);

-- Ensure all columns exist if table was previously created with fewer columns
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists student_number text;
alter table public.profiles add column if not exists nickname text;
alter table public.profiles add column if not exists age smallint;
alter table public.profiles add column if not exists institute text;
alter table public.profiles add column if not exists course text;
alter table public.profiles add column if not exists quiz_passed_at timestamptz;
alter table public.profiles add column if not exists vibes smallint[];
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- 2. Rooms Table (24-hour ephemeral groups)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  is_active boolean not null default true
);

-- 3. Room Members Table
create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- 4. Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 5. Matchmaking Queue Table
create table if not exists public.match_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.match_queue add column if not exists last_seen_at timestamptz not null default now();

-- 6. Message Reactions Table
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- 7. Room Leaves Table (Tombstone preventing room rejoining)
create table if not exists public.room_leaves (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  left_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at);

create index if not exists room_members_user_idx
  on public.room_members (user_id);

create index if not exists rooms_expires_idx
  on public.rooms (expires_at);

create index if not exists room_leaves_user_idx
  on public.room_leaves (user_id);

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS) ENABLEMENT
-- ═══════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.match_queue enable row level security;
alter table public.message_reactions enable row level security;
alter table public.room_leaves enable row level security;

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════
create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.user_id = auth.uid()
  );
$$;

create or replace function public.room_not_expired(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.expires_at > now()
  );
$$;

create or replace function public.can_interact_with_message(target_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.messages m
    where m.id = target_message_id
      and public.is_room_member(m.room_id)
      and public.room_not_expired(m.room_id)
  );
$$;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES (Idempotent Drop + Create)
-- ═══════════════════════════════════════════════════════════════

-- Profiles policies
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Rooms policies
drop policy if exists "Active rooms are viewable while not expired" on public.rooms;
create policy "Active rooms are viewable while not expired"
  on public.rooms for select to authenticated using (expires_at > now());

-- Room members policies
drop policy if exists "Members view co-members of their rooms" on public.room_members;
create policy "Members view co-members of their rooms"
  on public.room_members for select to authenticated
  using (auth.uid() = user_id or public.is_room_member(room_id));

-- Room members are seated exclusively by open_batch_room RPC; no direct insert permitted.
drop policy if exists "Users join active rooms as themselves" on public.room_members;

drop policy if exists "Users leave their own memberships" on public.room_members;
create policy "Users leave their own memberships"
  on public.room_members for delete to authenticated
  using (auth.uid() = user_id);

-- Room leaves policies
drop policy if exists "Room leaves are viewable by authenticated users" on public.room_leaves;
create policy "Room leaves are viewable by authenticated users"
  on public.room_leaves for select to authenticated using (true);

drop policy if exists "Users record their own room departure" on public.room_leaves;
create policy "Users record their own room departure"
  on public.room_leaves for insert to authenticated with check (auth.uid() = user_id);

-- Messages policies
drop policy if exists "Room members read messages of unexpired rooms" on public.messages;
create policy "Room members read messages of unexpired rooms"
  on public.messages for select to authenticated
  using (public.is_room_member(room_id) and public.room_not_expired(room_id));

drop policy if exists "Room members post their own messages to unexpired rooms" on public.messages;
create policy "Room members post their own messages to unexpired rooms"
  on public.messages for insert to authenticated
  with check (auth.uid() = user_id and public.is_room_member(room_id) and public.room_not_expired(room_id));

-- Match queue policies
drop policy if exists "Queue is viewable while waiting" on public.match_queue;
create policy "Queue is viewable while waiting"
  on public.match_queue for select to authenticated using (true);

drop policy if exists "Freshies join the queue as themselves" on public.match_queue;
create policy "Freshies join the queue as themselves"
  on public.match_queue for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Freshies leave the queue themselves" on public.match_queue;
create policy "Freshies leave the queue themselves"
  on public.match_queue for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Waiting freshies refresh their spot" on public.match_queue;
create policy "Waiting freshies refresh their spot"
  on public.match_queue for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Message reactions policies
drop policy if exists "Room members read reactions of unexpired rooms" on public.message_reactions;
create policy "Room members read reactions of unexpired rooms"
  on public.message_reactions for select to authenticated using (public.can_interact_with_message(message_id));

drop policy if exists "Members react as themselves to unexpired rooms" on public.message_reactions;
create policy "Members react as themselves to unexpired rooms"
  on public.message_reactions for insert to authenticated
  with check (auth.uid() = user_id and public.can_interact_with_message(message_id));

drop policy if exists "Members remove their own reactions" on public.message_reactions;
create policy "Members remove their own reactions"
  on public.message_reactions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Members update their own reactions" on public.message_reactions;
create policy "Members update their own reactions"
  on public.message_reactions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.can_interact_with_message(message_id));

-- ═══════════════════════════════════════════════════════════════
-- AUTH TRIGGER FOR PROFILES
-- ═══════════════════════════════════════════════════════════════
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- ATOMIC MATCHMAKING & CLEANUP RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════════
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

  if array_length(p_members, 1) < 3 or array_length(p_members, 1) > 4 then
    raise exception 'batch size must be 3 or 4';
  end if;

  if (
    select count(*) from public.match_queue
    where user_id = any(p_members)
  ) <> array_length(p_members, 1) then
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

create or replace function public.purge_stale_queue()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.match_queue
  where last_seen_at < now() - interval '3 minutes';
$$;

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

create or replace function public.user_quit_and_reset(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_remaining_members integer;
begin
  -- 1. Remove from match queue
  delete from public.match_queue where user_id = p_user_id;

  -- 2. Find and leave all rooms
  for v_room_id in
    select room_id from public.room_members where user_id = p_user_id
  loop
    insert into public.room_leaves (room_id, user_id, left_at)
    values (v_room_id, p_user_id, now())
    on conflict (room_id, user_id) do update set left_at = now();

    delete from public.room_members where room_id = v_room_id and user_id = p_user_id;

    -- Check if room is now empty
    select count(*) into v_remaining_members from public.room_members where room_id = v_room_id;

    if v_remaining_members = 0 then
      delete from public.rooms where id = v_room_id;
    end if;
  end loop;
end;
$$;

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


-- ═══════════════════════════════════════════════════════════════
-- REALTIME PUBLICATION SETUP (Safe / Non-duplicate)
-- ═══════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;

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
