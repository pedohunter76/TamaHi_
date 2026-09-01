create extension if not exists pgcrypto;

create table public.profiles (
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

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  is_active boolean not null default true
);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at);

create index if not exists room_members_user_idx
  on public.room_members (user_id);

create index if not exists rooms_expires_idx
  on public.rooms (expires_at);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

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

create policy "Profiles are viewable by authenticated users"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Active rooms are viewable while not expired"
  on public.rooms
  for select
  to authenticated
  using (expires_at > now());

create policy "Members view co-members of their rooms"
  on public.room_members
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_room_member(room_id));

create policy "Users join active rooms as themselves"
  on public.room_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.room_not_expired(room_id)
  );

create policy "Users leave their own memberships"
  on public.room_members
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Room members read messages of unexpired rooms"
  on public.messages
  for select
  to authenticated
  using (
    public.is_room_member(room_id)
    and public.room_not_expired(room_id)
  );

create policy "Room members post their own messages to unexpired rooms"
  on public.messages
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_room_member(room_id)
    and public.room_not_expired(room_id)
  );

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

create table public.match_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.match_queue enable row level security;

create policy "Queue is viewable while waiting"
  on public.match_queue
  for select
  to authenticated
  using (true);

create policy "Freshies join the queue as themselves"
  on public.match_queue
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Freshies leave the queue themselves"
  on public.match_queue
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Waiting freshies refresh their spot"
  on public.match_queue
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

create or replace function public.purge_stale_queue()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.match_queue
  where last_seen_at < now() - interval '3 minutes';
$$;

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

alter table public.message_reactions enable row level security;

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

create policy "Room members read reactions of unexpired rooms"
  on public.message_reactions
  for select
  to authenticated
  using (public.can_interact_with_message(message_id));

create policy "Members react as themselves to unexpired rooms"
  on public.message_reactions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_interact_with_message(message_id)
  );

create policy "Members remove their own reactions"
  on public.message_reactions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Members update their own reactions"
  on public.message_reactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.can_interact_with_message(message_id)
  );

-- Enable Supabase Realtime publication for chat messages and reactions
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;

