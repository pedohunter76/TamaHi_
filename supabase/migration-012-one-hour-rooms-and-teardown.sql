-- ═══════════════════════════════════════════════════════════════
-- Migration 012: 1-Hour Ephemeral Rooms, Empty Room Teardown, and RLS Cleanup
-- ═══════════════════════════════════════════════════════════════

-- 1. Alter rooms table default expires_at to 1 hour
alter table if exists public.rooms
  alter column expires_at set default now() + interval '1 hour';

-- 2. Add RLS policy allowing authenticated users to delete empty or expired rooms
drop policy if exists "Authenticated users delete empty or expired rooms" on public.rooms;
create policy "Authenticated users delete empty or expired rooms"
  on public.rooms for delete to authenticated
  using (
    expires_at <= now() or not exists (
      select 1 from public.room_members rm where rm.room_id = id
    )
  );

-- 3. Update open_batch_room to create rooms with a 1-hour expiration
create or replace function public.open_batch_room(p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_member uuid;
  v_queued_count integer;
  v_batch_size integer := coalesce(array_length(p_members, 1), 0);
begin
  if v_batch_size < 2 or v_batch_size > 4 then
    raise exception 'batch size must be between 2 and 4';
  end if;

  perform pg_advisory_xact_lock(hashtext('match_queue'));

  select count(*) into v_queued_count
  from public.match_queue
  where user_id = any(p_members);

  if v_queued_count <> v_batch_size then
    raise exception 'batch members are no longer all queued';
  end if;

  -- Create room explicitly with 1-hour expiration
  insert into public.rooms (expires_at)
  values (now() + interval '1 hour')
  returning id into v_room_id;

  foreach v_member in array p_members loop
    insert into public.room_members (room_id, user_id)
    values (v_room_id, v_member);

    delete from public.match_queue
    where user_id = v_member;
  end loop;

  return v_room_id;
end;
$$;

-- 4. Update leave_room_and_cleanup to delete room immediately if 0 members remain
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
  -- Record departure in room_leaves so rejoining is permanently locked
  insert into public.room_leaves (room_id, user_id)
  values (p_room_id, p_user_id)
  on conflict (room_id, user_id) do nothing;

  -- Delete from active room members
  delete from public.room_members where room_id = p_room_id and user_id = p_user_id;

  -- Count remaining active room members
  select count(*) into v_remaining_members from public.room_members where room_id = p_room_id;

  if v_remaining_members = 0 then
    -- Immediately delete the room if no freshies remain
    delete from public.rooms where id = p_room_id;
  else
    -- Announce departure to remaining room members via chat message
    select nickname into v_nickname from public.profiles where id = p_user_id;
    if v_nickname is null or trim(v_nickname) = '' then
      v_nickname := 'A freshie';
    end if;

    insert into public.messages (room_id, user_id, content)
    values (p_room_id, p_user_id, '👋 ' || v_nickname || ' has left the batch room.');
  end if;
end;
$$;

-- 5. Helper function to clean up empty or expired rooms
create or replace function public.cleanup_empty_and_expired_rooms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.rooms r
  where r.expires_at <= now()
     or not exists (select 1 from public.room_members rm where rm.room_id = r.id);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
