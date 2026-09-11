-- Run this once in your Supabase project's SQL editor (or `supabase db push`
-- if you use the Supabase CLI locally) after creating the project.

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

alter table public.builds enable row level security;

create policy "Users can view their own builds"
  on public.builds for select
  using (auth.uid() = user_id);

create policy "Users can insert their own builds"
  on public.builds for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own builds"
  on public.builds for delete
  using (auth.uid() = user_id);

create index if not exists builds_user_id_created_at_idx
  on public.builds (user_id, created_at desc);

-- If you already ran an earlier version of this file against a live
-- project (it had `budget` and `allocation` columns), run this once instead
-- of the create table above to bring that table up to date without losing
-- existing rows:
--
-- alter table public.builds drop column if exists budget;
-- alter table public.builds drop column if exists allocation;
