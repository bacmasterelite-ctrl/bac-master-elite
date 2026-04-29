-- ============================================================
-- BAC MASTER ELITE — Premium gating
-- Paste into Supabase → SQL Editor → Run (after 001_init.sql)
-- ============================================================

-- ----- 1. LESSONS: add gating + content columns -------------
do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'lessons') then
    alter table public.lessons
      add column if not exists is_free boolean not null default false,
      add column if not exists content text;
  else
    create table public.lessons (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      subject text,
      serie text,
      duration text,
      is_free boolean not null default false,
      content text,
      created_at timestamptz not null default now()
    );
    alter table public.lessons enable row level security;
    create policy "lessons_public_read" on public.lessons
      for select using (true);
  end if;
end $$;

-- ----- 2. EXERCISES: same flag (optional, future-proof) -----
do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'exercises') then
    alter table public.exercises
      add column if not exists is_free boolean not null default false;
  end if;
end $$;
