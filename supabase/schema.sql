-- ============================================================================
-- zap dashboard — Supabase schema  (idempotent, run in the SQL editor)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- users  (mirrors auth.users for app-specific columns)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique,
  created_at  timestamptz not null default now(),
  plan        text not null default 'free' check (plan in ('free', 'pro', 'team'))
);

alter table public.users enable row level security;

drop policy if exists "users can view their own row"    on public.users;
drop policy if exists "users can update their own row"  on public.users;

create policy "users can view their own row"
  on public.users for select using (auth.uid() = id);

create policy "users can update their own row"
  on public.users for update using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- user_settings
-- ----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id     uuid primary key references public.users(id) on delete cascade,
  check_mode  text not null default 'ask' check (check_mode in ('always', 'never', 'ask')),
  ai_default  boolean not null default false,
  warn_main   boolean not null default true,
  theme       text not null default 'dark',
  updated_at  timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "users can view their own settings"   on public.user_settings;
drop policy if exists "users can update their own settings" on public.user_settings;
drop policy if exists "users can insert their own settings" on public.user_settings;

create policy "users can view their own settings"
  on public.user_settings for select using (auth.uid() = user_id);

create policy "users can update their own settings"
  on public.user_settings for update using (auth.uid() = user_id);

create policy "users can insert their own settings"
  on public.user_settings for insert with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- push_events
-- ----------------------------------------------------------------------------
create table if not exists public.push_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  repo_url      text,
  branch        text not null,
  commit_hash   text not null,
  commit_msg    text not null,
  files_changed integer not null default 0,
  used_ai       boolean not null default false,
  undone        boolean not null default false,
  duration_ms   integer,
  created_at    timestamptz not null default now()
);

create index if not exists push_events_user_id_created_at_idx
  on public.push_events (user_id, created_at desc);

create index if not exists push_events_user_id_branch_idx
  on public.push_events (user_id, branch);

alter table public.push_events enable row level security;

drop policy if exists "users can view their own push events"   on public.push_events;
drop policy if exists "users can update their own push events" on public.push_events;
drop policy if exists "users can delete their own push events" on public.push_events;

create policy "users can view their own push events"
  on public.push_events for select using (auth.uid() = user_id);

create policy "users can update their own push events"
  on public.push_events for update using (auth.uid() = user_id);

create policy "users can delete their own push events"
  on public.push_events for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ai_usage
-- ----------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  tokens_used integer not null default 0,
  model       text not null default 'google/gemma-4-31b-it',
  created_at  timestamptz not null default now()
);

create index if not exists ai_usage_user_id_created_at_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists "users can view their own ai usage" on public.ai_usage;

create policy "users can view their own ai usage"
  on public.ai_usage for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- api_keys  (SHA-256 hashes only — raw keys are never stored)
-- ----------------------------------------------------------------------------
create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  key_hash      text not null unique,
  label         text not null default 'CLI key',
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx  on public.api_keys (user_id);
create index if not exists api_keys_hash_idx     on public.api_keys (key_hash);

alter table public.api_keys enable row level security;

drop policy if exists "users can view their own api keys"   on public.api_keys;
drop policy if exists "users can insert their own api keys" on public.api_keys;
drop policy if exists "users can revoke their own api keys" on public.api_keys;
drop policy if exists "users can delete their own api keys" on public.api_keys;

create policy "users can view their own api keys"
  on public.api_keys for select using (auth.uid() = user_id);

create policy "users can insert their own api keys"
  on public.api_keys for insert with check (auth.uid() = user_id);

create policy "users can revoke their own api keys"
  on public.api_keys for update using (auth.uid() = user_id);

create policy "users can delete their own api keys"
  on public.api_keys for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- New-user bootstrap trigger
-- Creates public.users + user_settings rows immediately on auth.users insert.
-- The app also calls ensureUserRecord() as a belt-and-suspenders safety net
-- on every dashboard page load, so late-signup users (created before this
-- trigger existed) are never blocked from generating API keys.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Helper view: push counts per day (used by the activity chart)
-- ----------------------------------------------------------------------------
create or replace view public.push_counts_by_day as
select
  user_id,
  date_trunc('day', created_at) as day,
  count(*) as push_count,
  count(*) filter (where used_ai) as ai_push_count
from public.push_events
group by user_id, date_trunc('day', created_at);
