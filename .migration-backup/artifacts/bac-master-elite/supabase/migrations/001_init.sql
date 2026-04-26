-- ============================================================
-- BAC MASTER ELITE — Schema migration
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ----- 1. PROFILES: add missing columns ---------------------
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists serie text,
  add column if not exists is_premium boolean not null default false,
  add column if not exists is_admin boolean not null default false,
  add column if not exists points integer not null default 0,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now();

-- Make `id` link to auth.users so we can upsert from the client
do $$ begin
  alter table public.profiles
    add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
exception when duplicate_object then null;
end $$;

-- ----- 2. AUTO-PROFILE on signup ----------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, serie)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'serie', 'D')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        serie = coalesce(public.profiles.serie, excluded.serie);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill missing profiles for existing auth users
insert into public.profiles (id, email, full_name, serie)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
       coalesce(u.raw_user_meta_data->>'serie', 'D')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ----- 3. PROFILES RLS --------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (true);                 -- anyone authenticated can read (for leaderboard)

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ----- 4. SUBSCRIPTIONS table -------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'premium_mensuel',
  amount integer not null default 5000,           -- in FCFA
  currency text not null default 'XOF',
  payment_method text,                            -- 'wave' | 'mtn' | 'orange'
  proof_url text,
  status text not null default 'en_attente',      -- 'en_attente' | 'valide' | 'rejete'
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by uuid references auth.users(id)
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists "sub_owner_select" on public.subscriptions;
create policy "sub_owner_select" on public.subscriptions
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "sub_owner_insert" on public.subscriptions;
create policy "sub_owner_insert" on public.subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "sub_admin_update" on public.subscriptions;
create policy "sub_admin_update" on public.subscriptions
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ----- 5. STORAGE BUCKET 'proofs' ---------------------------
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

drop policy if exists "proofs_owner_upload" on storage.objects;
create policy "proofs_owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "proofs_owner_read" on storage.objects;
create policy "proofs_owner_read" on storage.objects
  for select using (
    bucket_id = 'proofs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
    )
  );

-- ----- 6. RLS for content tables ----------------------------
do $$
declare t text;
begin
  foreach t in array array['lessons', 'exercises', 'annals', 'subjects', 'series']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%I_public_read" on public.%I;', t, t);
    execute format('create policy "%I_public_read" on public.%I for select using (true);', t, t);
  end loop;
end $$;

-- ============================================================
-- DONE. Optional: promote yourself to admin once signed up:
--   update public.profiles set is_admin = true where email = 'YOUR_EMAIL';
-- ============================================================
