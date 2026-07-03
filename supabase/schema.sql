-- The Ramp — run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- Safe to run more than once — every statement either checks "if not exists"
-- or drops-then-recreates, so re-running this after an update won't error.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null default '',
  preset text,
  enabled_features jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Generic per-user key/value store — holds everything else (calls, jobs,
-- notes, tasks, stories, events, etc). Each browser localStorage key from
-- before becomes one row here, scoped to the signed-in user.

create table if not exists public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_data enable row level security;

drop policy if exists "Users can view own data" on public.user_data;
create policy "Users can view own data" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own data" on public.user_data;
create policy "Users can insert own data" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own data" on public.user_data;
create policy "Users can update own data" on public.user_data
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own data" on public.user_data;
create policy "Users can delete own data" on public.user_data
  for delete using (auth.uid() = user_id);
