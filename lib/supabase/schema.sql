-- Safe to run this whole file again any time, on a brand-new project or an
-- existing one: every statement either checks for existing state first or
-- drops-then-recreates, so nothing errors on a second run.

create table if not exists public.builds (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  requirements jsonb not null,
  components jsonb not null,
  performance jsonb not null,
  compatibility jsonb not null,
  created_at timestamptz not null default now()
);

-- Older versions of this file had `budget`/`allocation` NOT NULL columns
-- the app no longer writes to, which fails every insert until dropped.
alter table public.builds drop column if exists budget;
alter table public.builds drop column if exists allocation;

alter table public.builds enable row level security;

drop policy if exists "Users can view their own builds" on public.builds;
create policy "Users can view their own builds"
  on public.builds for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own builds" on public.builds;
create policy "Users can insert their own builds"
  on public.builds for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own builds" on public.builds;
create policy "Users can update their own builds"
  on public.builds for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own builds" on public.builds;
create policy "Users can delete their own builds"
  on public.builds for delete
  using (auth.uid() = user_id);

create index if not exists builds_user_id_created_at_idx
  on public.builds (user_id, created_at desc);
