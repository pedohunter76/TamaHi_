create policy "Waiting freshies refresh their spot"
  on public.match_queue for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.purge_stale_queue()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.match_queue
  where joined_at < now() - interval '3 minutes';
$$;
