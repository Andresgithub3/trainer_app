-- Benchmark Tracker — initial schema (PRD §8)
-- Single-user app. RLS enabled; the authenticated user (magic-link) has full
-- access. Seed/verify scripts use the service-role key, which bypasses RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists lifts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text not null check (category in ('upper', 'lower')),
  current_tm  numeric not null check (current_tm > 0),
  created_at  timestamptz not null default now()
);

create table if not exists tm_history (
  id              uuid primary key default gen_random_uuid(),
  lift_id         uuid not null references lifts(id) on delete cascade,
  value           numeric not null check (value > 0),
  effective_date  date not null,
  reason          text,
  created_at      timestamptz not null default now()
);

create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  day_type    text not null check (day_type in
                ('squat', 'bench', 'deadlift', 'ohp', 'easy_run', 'long_run', 'rest')),
  block       int not null check (block >= 1),
  week        int not null check (week between 1 and 4),
  status      text not null default 'upcoming'
                check (status in ('upcoming', 'in_progress', 'completed', 'skipped')),
  created_at  timestamptz not null default now()
);

create table if not exists set_logs (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references sessions(id) on delete cascade,
  lift_id            uuid not null references lifts(id),
  set_index          int not null,
  is_amrap           boolean not null default false,
  prescribed_weight  numeric,
  prescribed_reps    int,
  actual_weight      numeric,
  actual_reps        int,
  created_at         timestamptz not null default now()
);

-- Accessory weights are free-form on purpose: real entries are "bodyweight",
-- "6 plates", "banded", etc. — not always pounds. Reps are integers; any
-- qualifier (assisted, drop, etc.) goes in notes.
create table if not exists accessory_logs (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  name         text not null,
  set1_weight  text,
  set1_reps    int,
  set2_weight  text,
  set2_reps    int,
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists runs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references sessions(id) on delete cascade,
  type          text not null check (type in ('easy', 'tempo', 'long')),
  duration_min  numeric,
  distance      numeric,
  effort_note   text,
  created_at    timestamptz not null default now()
);

create table if not exists plate_inventory (
  id              uuid primary key default gen_random_uuid(),
  plate_weight    numeric not null,
  count_per_side  int not null check (count_per_side >= 0),
  bar_weight      numeric not null default 45
);

-- Single-row table (id is pinned to 1).
create table if not exists settings (
  id                  int primary key default 1 check (id = 1),
  current_block       int not null,
  current_week        int not null check (current_week between 1 and 4),
  program_start_date  date not null,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_set_logs_session on set_logs(session_id);
create index if not exists idx_accessory_logs_session on accessory_logs(session_id);
create index if not exists idx_tm_history_lift on tm_history(lift_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — single user: authenticated may do everything.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'lifts', 'tm_history', 'sessions', 'set_logs',
    'accessory_logs', 'runs', 'plate_inventory', 'settings'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists authenticated_all on %I;', t);
    execute format(
      'create policy authenticated_all on %I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime (keeps phone/laptop in sync). Wrapped so a re-run is harmless.
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table
    lifts, tm_history, sessions, set_logs,
    accessory_logs, runs, plate_inventory, settings;
exception when others then null;
end $$;
