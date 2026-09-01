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
