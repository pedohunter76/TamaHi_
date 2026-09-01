alter table public.profiles alter column email drop not null;

alter table public.profiles
  add column if not exists student_number text,
  add column if not exists nickname text,
  add column if not exists quiz_passed_at timestamptz;

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
