-- Private habit calendar for the verified @itisci account.
-- Apply with an administrator connection / Supabase SQL Editor; never from the browser client.
-- Identity was verified via the public profiles API on 2026-10-18.
begin;

create table public.private_habit_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton)
);
create table public.private_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index private_habits_user_created on public.private_habits (user_id, created_at, id);
create table public.private_habit_days (
  habit_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_on date not null check (completed_on <= (now() at time zone 'Europe/Istanbul')::date),
  primary key (habit_id, completed_on),
  foreign key (habit_id, user_id) references public.private_habits(id, user_id) on delete cascade
);
create index private_habit_days_user on public.private_habit_days (user_id);

alter table public.private_habit_access enable row level security;
alter table public.private_habits enable row level security;
alter table public.private_habit_days enable row level security;

revoke all on public.private_habit_access, public.private_habits, public.private_habit_days
  from public, anon, authenticated;
grant select on public.private_habit_access to authenticated;
grant select, insert, update, delete on public.private_habits, public.private_habit_days to authenticated;
grant all on public.private_habit_access, public.private_habits, public.private_habit_days to service_role;

create policy private_habit_access_self on public.private_habit_access
  for select to authenticated using (user_id = (select auth.uid()));
create policy private_habits_owner on public.private_habits
  for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ));
create policy private_habit_days_owner on public.private_habit_days
  for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.private_habit_access a where a.user_id = (select auth.uid())
  ));

-- One immutable account binding; clients have no INSERT/UPDATE/DELETE access to this table.
insert into public.private_habit_access (user_id) values ('ba569072-755d-4e68-b470-d78bacbdf0c6');

commit;
