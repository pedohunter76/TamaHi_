create table public.message_reactions (
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
