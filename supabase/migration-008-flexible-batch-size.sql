-- Migration 008: Allow early launch with 3 freshies or full batch of 4
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
