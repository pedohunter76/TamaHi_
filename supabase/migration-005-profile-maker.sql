alter table public.profiles
  add column if not exists age smallint,
  add column if not exists institute text,
  add column if not exists course text;

alter table public.profiles
  drop column if exists strand_or_institute;
