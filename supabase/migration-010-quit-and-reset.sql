-- Migration 010: Complete user quit & room cleanup
-- Allows instantaneous cleanup when users close the tab, leave the room, or reset their session

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
begin
  delete from public.room_members where room_id = p_room_id and user_id = p_user_id;

  select count(*) into v_remaining_members from public.room_members where room_id = p_room_id;

  if v_remaining_members = 0 then
    delete from public.rooms where id = p_room_id;
  end if;
end;
$$;
